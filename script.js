const api = "https://pokeapi.co/api/v2/pokemon?limit=1025"

function capitalize(text){
return text.charAt(0).toUpperCase()+text.slice(1)
}

/* =========================
CONFIGURAÇÕES
========================= */

let mode = localStorage.getItem("pokedexMode") || "game"

function getFavoritos(){
return JSON.parse(localStorage.getItem("favoritos")) || []
}

function salvarFavoritos(lista){
localStorage.setItem("favoritos",JSON.stringify(lista))
}

/* =========================
SOM
========================= */

function tocarSom(nome){

const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${nome}.mp3`)

audio.volume = 0.4
audio.currentTime = 0

audio.play().catch(()=>{})

}

/* =========================
LISTA DE POKEMON
========================= */

async function carregarPokemons(){

const list = document.getElementById("pokemonList")
if(!list) return

const res = await fetch(api)
const data = await res.json()

list.innerHTML=""

const favoritos = getFavoritos()

data.results.forEach((pokemon,index)=>{

const id=index+1

const card=document.createElement("div")
card.className="card"
card.id=`pokemon-${id}`

card.style.animationDelay = (index * 0.03) + "s"

card.innerHTML=`

<p class="id">#${id}</p>

<img loading="lazy"
src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">

<h3>${capitalize(pokemon.name)}</h3>

<button class="fav-btn ${favoritos.includes(id) ? 'active' : ''}">⭐</button>

`

card.onclick=()=>abrirPokemon(id)

card.querySelector(".fav-btn").onclick=(e)=>{
e.stopPropagation()
favoritar(id)
}

card.onmouseenter=()=>tocarSom(pokemon.name)

list.appendChild(card)

})

voltarScroll()

}

/* =========================
FAVORITAR
========================= */

function favoritar(id){

let favoritos=getFavoritos()

if(favoritos.includes(id)){

favoritos=favoritos.filter(p=>p!==id)

}else{

favoritos.push(id)

}

salvarFavoritos(favoritos)

location.reload()

}

/* =========================
ABRIR POKEMON
========================= */

function abrirPokemon(id){

localStorage.setItem("lastPokemon",id)

window.location=`pokemon.html?id=${id}`

}

/* =========================
SCROLL
========================= */

function voltarScroll(){

const lastPokemon=localStorage.getItem("lastPokemon")

if(lastPokemon){

setTimeout(()=>{
document.getElementById(`pokemon-${lastPokemon}`)
?.scrollIntoView({behavior:"auto",block:"center"})
},100)

}

}

/* =========================
DETALHE POKEMON
========================= */

async function carregarPokemon(){

const params=new URLSearchParams(window.location.search)
const id=params.get("id")
if(!id) return

const res=await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
const data=await res.json()

const speciesRes=await fetch(data.species.url)
const speciesData=await speciesRes.json()

/* descrição */

let entry =
speciesData.flavor_text_entries.find(e=>e.language.name==="pt") ||
speciesData.flavor_text_entries.find(e=>e.language.name==="en")

const description=entry ?
entry.flavor_text.replace(/\n|\f/g," ")
:"Descrição não disponível."

/* sprites */

let normalSprite=data.sprites?.other?.["official-artwork"]?.front_default
let shinySprite=data.sprites?.other?.["official-artwork"]?.front_shiny

if(!normalSprite) normalSprite=data.sprites.front_default
if(!shinySprite) shinySprite=normalSprite

/* habilidades */

const abilities=data.abilities.map(a=>`
<li>${capitalize(a.ability.name)}</li>
`).join("")

/* stats */

const stats=data.stats.map(stat=>{

const percent=Math.min(stat.base_stat,100)

return`

<div class="stat">

<span>${capitalize(stat.stat.name)} (${stat.base_stat})</span>

<div class="bar">
<div class="fill" data-value="${percent}"></div>
</div>

</div>

`

}).join("")

/* FORMAS */

const forms = speciesData.varieties.map(v => {

const name = v.pokemon.name

let label = name
.replace("-mega-x"," Mega X")
.replace("-mega-y"," Mega Y")
.replace("-mega"," Mega")
.replace("-alola"," Alola")
.replace("-galar"," Galar")
.replace("-hisui"," Hisui")
.replace("-paldea"," Paldea")

return `
<button class="form-btn" onclick="abrirForma('${name}')">
${capitalize(label)}
</button>
`

}).join("")

/* render */

const div=document.getElementById("pokemonDetail")

div.innerHTML=`

<div class="pokemon-card">

<div class="nav">
<button onclick="mudarPokemon(${id-1})">←</button>
<button onclick="voltarLista()">Lista</button>
<button onclick="mudarPokemon(${parseInt(id)+1})">→</button>
</div>

<h1>${capitalize(data.name)}</h1>

<img id="pokemonSprite" src="${normalSprite}">

<h3>Formas</h3>
<div class="forms">
${forms}
</div>

<button onclick="toggleShiny()">✨ Shiny</button>

<p class="description">${description}</p>

<h3>Habilidades</h3>
<ul class="abilities">
${abilities}
</ul>

<h3>Status</h3>
${stats}

<h3>Evoluções</h3>
<div id="evolutions"></div>

<button onclick="favoritar(${id})">⭐ Favoritar</button>

</div>

`

/* shiny */

window.toggleShiny=function(){

const img=document.getElementById("pokemonSprite")

if(img.src===normalSprite){
img.src=shinySprite
}else{
img.src=normalSprite
}

}

/* evoluções */

buscarEvolucoes(speciesData.evolution_chain.url)

/* som */

tocarSom(data.name)

/* animar stats */

animarStats()

}

/* =========================
FORMAS
========================= */

async function abrirForma(nome){

const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`)
const data = await res.json()

const sprite = data.sprites?.other?.["official-artwork"]?.front_default

document.getElementById("pokemonSprite").src = sprite

tocarSom(data.name)

}

/* =========================
EVOLUÇÕES
========================= */

async function buscarEvolucoes(url){

const res=await fetch(url)
const data=await res.json()

const container=document.getElementById("evolutions")

let evolutions=[]

function extrair(chain){

evolutions.push(chain.species.name)

chain.evolves_to.forEach(e=>{
extrair(e)
})

}

extrair(data.chain)

container.innerHTML=evolutions.map(name=>`

<div class="evo">

<img src="https://img.pokemondb.net/sprites/home/normal/${name}.png">

<p>${capitalize(name)}</p>

</div>

`).join("")

}

/* =========================
ANIMAR STATS
========================= */

function animarStats(){

setTimeout(()=>{

document.querySelectorAll(".fill").forEach(bar=>{

const value=bar.dataset.value

bar.style.width=value+"%"

})

},100)

}

/* =========================
BUSCA
========================= */

function searchPokemon(){

const input=document.getElementById("search")
if(!input) return

const value=input.value.toLowerCase()

document.querySelectorAll(".card").forEach(card=>{

const name=card.innerText.toLowerCase()

card.style.display=name.includes(value) ? "block":"none"

})

}

/* =========================
FAVORITOS PAGE
========================= */

function carregarFavoritos(){

const list=document.getElementById("pokemonList")
if(!list) return

const favoritos=getFavoritos()

list.innerHTML=""

if(favoritos.length===0){

list.innerHTML="<p>Nenhum favorito ainda.</p>"
return

}

favoritos.forEach(id=>{

const card=document.createElement("div")

card.className="card"

card.innerHTML=`

<p>#${id}</p>

<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">

`

card.onclick=()=>abrirPokemon(id)

list.appendChild(card)

})

}

/* =========================
BOTÕES
========================= */

function showFavorites(){
window.location="favoritos.html"
}

function showAll(){
window.location="index.html"
}

/* =========================
MODO ANIME
========================= */

const modeButton=document.getElementById("toggleMode")

function aplicarModo(){

if(!modeButton) return

if(mode==="anime"){

document.body.classList.add("anime-mode")
modeButton.innerText="Modo Jogo"

}else{

document.body.classList.remove("anime-mode")
modeButton.innerText="Modo Anime"

}

}

if(modeButton){

aplicarModo()

modeButton.onclick=()=>{

mode = mode === "game" ? "anime" : "game"

localStorage.setItem("pokedexMode",mode)

aplicarModo()

}

}

/* =========================
NAVEGAÇÃO
========================= */

function mudarPokemon(id){

if(id<1) id=1025
if(id>1025) id=1

window.location=`pokemon.html?id=${id}`

}

function voltarLista(){

window.location="index.html"

}

/* =========================
INIT
========================= */

carregarPokemons()
carregarPokemon()
carregarFavoritos()