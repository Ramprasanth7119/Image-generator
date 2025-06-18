import { API_KEY as _API_KEY } from './config.js';

const themeToggle = document.getElementById('theme-toggle');
const promptInput = document.getElementById('prompt-input');
const promptButton = document.getElementById('generate-btn');
const promptForm = document.querySelector('.prompt-form');
const generateBtn = document.getElementById('generate-btn');


const modelSelect = document.getElementById('model-select');
const countSelect = document.getElementById('count-select');
const ratioSelect = document.getElementById('ratio-select');

const gridGallery = document.querySelector('.gallery-grid');

const API_KEY = _API_KEY || process.env.API_KEY;


const examplePrompts = [
    "A serene landscape with mountains and a river",
    "A futuristic city skyline at sunset",
    "A cozy cabin in the woods during winter",
    "A vibrant underwater scene with colorful fish",
    "A mystical forest with glowing plants",
    "A bustling market in a medieval town",
    "A majestic castle on a hilltop",
    "A peaceful beach with palm trees and clear water",
    "A dramatic stormy sky over a desert landscape",  
    "A whimsical garden filled with flowers and butterflies"
];

// Immediately invoked function to set the initial theme based on localStorage or system preference
(() =>{
    const savedTheme = localStorage.getItem('theme');
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDark = savedTheme === 'dark' || (savedTheme === null && systemPreference);
    document.body.classList.toggle('dark-theme', isDark);
    themeToggle.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
})();
// This script toggles the theme between light and dark modes



// Load the saved theme from localStorage
const toggleTheme = () => {

    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

const getImageDimensions = (aspectRatio, baseSize = 512) =>{

    const[width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.random(height * scaleFactor);

    calculatedHeight = Math.floor(calculatedHeight / 16 * 16);
    calculatedWidth = Math.floor(calculatedWidth / 16 * 16);

    return { width: calculatedWidth, height: calculatedHeight};

}

const updateImageCard = (imgIndex, imgUrl) =>{

    const imgCard = document.getElementById(`img-card-${imgIndex}`);

    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" alt="Generated Image" class="result-img">
                    <div class="img-overlay">
                        <button class="copy-btn" aria-label="Copy Image URL" type="button">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <a href="${imgUrl}" class="img-download-btn" aria-label="Download Image" download="${Date.now()}.png">
                            <i class="fa-solid fa-download"></i>
                        </a>
                </div>`;
}

const generateImages = async  (selectModel, imageCount, aspectRatio, promptText) =>{

    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectModel}`;

    const {width, height} = getImageDimensions(aspectRatio);

    generateBtn.setAttribute("disabled","true");

    const imagePromises = Array.from({length: imageCount}, async(_, i) => {

            try {

            const response = await fetch(MODEL_URL, {

                headers:{
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache":"false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters:{width, height},
                    // options:{wait_for_model: true, user_cache: false},
                }),
            });

            if(!response.ok) throw new Error((await response.json())?.error);

            const result = await response.blob();

            updateImageCard(i,URL.createObjectURL(result));
            
        } catch (error) {
            console.log(error);
            const imgCard = document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading", "error");
            imgCard.querySelector(".status-text").textContent = "Failed to generate image";
        }
    })

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");
    console.log("All images processed");
}

const createImageCards = (selectModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = ''; // Clear previous images

    for(let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio};">
                                        <div class="status-container">
                                        <div class="spinner"></div>
                                            <i class="fa-solid fa-triangle-exclamation"></i>
                                            <p class="status-text">Generating...</p>
                                        </div>
                                    </div>`
    }

    generateImages(selectModel, imageCount, aspectRatio, promptText);
}

const handleFormSubmit = (e) =>{

    e.preventDefault();
    const promptText = promptInput.value.trim();
    const selectModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";

    if (!promptText || !selectModel || !imageCount || !aspectRatio) {
        alert('Please fill in all fields.');
        return;
    }

    console.log(`Prompt: ${promptText}`);
    console.log(`Model: ${selectModel}`);
    console.log(`Image Count: ${imageCount}`);
    console.log(`Aspect Ratio: ${aspectRatio}`);

    createImageCards(selectModel, imageCount, aspectRatio, promptText);

    // Here you would typically send the data to your server or API

}

promptButton.addEventListener('click',() =>{
    const promptText = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = promptText;
    promptInput.focus();
    console.log(promptText);
})

promptForm.addEventListener('submit', handleFormSubmit);

themeToggle.addEventListener('click', toggleTheme);