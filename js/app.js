
function iniciarApp() {

    //! Variables
    const selectCategorias = document.querySelector('#categorias');
    const resultado = document.querySelector('#resultado');
    const modal = new bootstrap.Modal('#modal', {});

    if (selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');

    if (favoritosDiv) {
        obtenerFavoritos()
    }


    function obtenerCategorias() {

        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(answer => answer.json())
            .then(datos => mostrarCategorias(datos.categories))
            .catch(error => console.log(error))

    }

    function mostrarCategorias(categorias = []) {
        categorias.forEach(categoria => {
            const option = document.createElement('OPTION');
            option.value = categoria.strCategory;
            option.textContent = categoria.strCategory;
            selectCategorias.appendChild(option);
        });
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

        fetch(url)
            .then(answer => answer.json())
            .then(datos => mostrarRecetas(datos.meals))
            .catch(error => console.log(error))
    }

    function mostrarRecetas(recetas = []) {

        limpiarHTML(resultado);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length > 0 ? 'Resultados:' : 'No hay resultados';
        resultado.appendChild(heading);

        recetas.forEach(receta => {
            const { idMeal, strMeal, strMealThumb } = receta;

            //TODO Contenedor general
            const recetaDiv = document.createElement('DIV');
            recetaDiv.classList.add('col-md-4');

            //TODO Contenedor de las tarjetas de recetas
            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            //TODO Imagen de la receta
            const recetaImg = document.createElement('IMG');
            recetaImg.classList.add('card-img-top');
            recetaImg.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImg.src = strMealThumb ?? receta.img;

            //TODO Body para mostrar la receta
            const recetaBody = document.createElement('DIV');
            recetaBody.classList.add('card-body');

            //TODO Heading para la receta
            recetaHeading = document.createElement('h3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;

            //TODO Boton para ver la receta
            const recetaBtn = document.createElement('BUTTON');
            recetaBtn.classList.add('btn', 'btn-danger', 'w-100');
            recetaBtn.textContent = 'Ver Receta';
            //*Conecta este boton con el codigo en HTML del modal que aparece al darle click al boton
            recetaBtn.dataset.bsTarget = '#modal';
            recetaBtn.dataset.bsToggle = 'modal';

            recetaBtn.onclick = function () {
                seleccionarReceta(idMeal ?? receta.id);
            }

            //TODO Inyectar en el HTML
            recetaBody.appendChild(recetaHeading);
            recetaBody.appendChild(recetaBtn);

            recetaCard.appendChild(recetaImg);
            recetaCard.appendChild(recetaBody);

            recetaDiv.append(recetaCard);

            resultado.appendChild(recetaDiv);
        });
    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }

    function seleccionarReceta(id) {

        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
        fetch(url)
            .then(resultado => resultado.json())
            .then(datos => mostrarRectaModal(datos.meals[0]))
            .catch(error => console.log(error));
    }

    function mostrarRectaModal(receta) {

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

        //TODO Agregar contenido al modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta ${strMeal}"/>
            <h3 class="my-3">Instrucciones</h3>
            <p>${strInstructions} :</p>
            <h3 class="my-3">Ingredientes y Cantidades:</h3>
        `;

        const listGoup = document.createElement('UL');
        listGoup.classList.add('list-group');

        //TODO Mostrar cantidades e ingredientes
        for (let i = 1; i <= 20; i++) {
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

                listGoup.appendChild(ingredienteLi);
            }
        }

        modalBody.appendChild(listGoup);

        const modalFooter = document.querySelector('.modal-footer');

        limpiarHTML(modalFooter);

        //TODO Botones de Cerrar y Favorito
        const favoritoBtn = document.createElement('BUTTON');
        favoritoBtn.classList.add('btn', 'btn-danger', 'col');
        favoritoBtn.textContent = existeFavorito(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        const cerrarBtn = document.createElement('BUTTON');
        cerrarBtn.classList.add('btn', 'btn-secondary', 'col');
        cerrarBtn.textContent = 'Cerrar';
        cerrarBtn.onclick = () => modal.hide(); // Usa el prototype de Modal y la propiedad de 'hide' para ocular el modal

        modalFooter.appendChild(favoritoBtn);
        modalFooter.appendChild(cerrarBtn);

        //TODO LocalStorage
        favoritoBtn.onclick = () => {

            if ((existeFavorito(idMeal))) {
                elimiarFavorito(idMeal);
                favoritoBtn.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente');
                return;
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb,
            });
            favoritoBtn.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado Correctamente');
        }

        //* Mostrar el modal
        modal.show();
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
    }

    function existeFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
    }

    function elimiarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const favoritosNew = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify(favoritosNew));
    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);
        toastBody.textContent = mensaje;
        toast.show();

        setTimeout(() => {
            toast.hide();
        }, 2000);
    }

    function obtenerFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        console.log(favoritos);
        if(favoritos.length){
            mostrarRecetas(favoritos);
            return;
        }

        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay Favoritos aún';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
        resultado.appendChild(noFavoritos);
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);




// Categorias: https://www.themealdb.com/api/json/v1/1/categories.php

// Recetas de una categoria: https://www.themealdb.com/api/json/v1/1/filter.php?c=Beef

// Info del plato: https://themealdb.com/api/json/v1/1/lookup.php?i=52772