let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

let sections =  document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nava');

window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if(top >= offset && top < offset + height ){
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a [href*=' + id + ' ]').classList.add('active')
            })
        }
    })
}

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}

// Função para verificar se o elemento está visível na tela
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Função para adicionar a classe ao rolar
function handleScroll() {
    const habilidadeBoxes = document.querySelectorAll('.habilidade-box');
    
    habilidadeBoxes.forEach(box => {
        if (isElementInViewport(box)) {
            box.classList.add('scrolled');
        } else {
            box.classList.remove('scrolled');
        }
    });
}

// Adiciona o evento de rolagem
window.addEventListener('scroll', handleScroll);

// Chama a função para garantir que os elementos visíveis na inicialização recebam a classe
handleScroll();