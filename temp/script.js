// fetch('https://icanhazdadjoke.com/slack')
// .then(data => data.json())
// .then(jokeData => { //jo data humne JSON mein convert kiya usko humne jokeData mein store kiya hai
//     //console.log(jokeData);
//     //const jokeText = jokeData.attachments[0].text;
//     //joke = jokeText; //last mein jo .text aa raha hai usko define karna bahut zarur hai warna hamara computer yeh samjh hi nahi payega ki aaye huye data ko parse kaise karna hai
//     const jokeElement = document.getElementById('jokeElement'); //document is predefined object in javascript. Here it refers right back to the HTML file. getElementById is a method of document object. It is used to get the element by its id. Here we are getting the element by its id 'jokeElement' and storing it in jokeElement variable.
//     //jokeElement.innerHTML = jokeText; //innerHTML is used to update the data of the HTML file
//     jokeElement.innerHTML = jokeData.attachments[0].text; //yahan par humne naya variable banane ki jagah, directly jo API call se values humein leni thi humney asign kardi. This works too, but might not be the best approach. Make a variable. Make it simpler.
//     //jokeElement = jokeText; //iss waley mein humney jokeElement ko jokeText sey replace kardiya hai but issey hum display nahi karwa rahey hai apne extension mein
// })


// import { log } from "console";

// import { answer } from "./mistralAPI.js";

//console.log('in script.js answer is => ', answer);

let joke = 'ajao';



async function getJokeFromAPI() {
    const dataFromAPI = await fetch('https://icanhazdadjoke.com/slack');
    const jsonDataFromAPI = await dataFromAPI.json();
    const status = dataFromAPI.ok;
    console.log('status is', status);
    joke = jsonDataFromAPI.attachments[0].text;
    return joke;
    // console.log('inside the async function the joke is -',joke);
}

getJokeFromAPI().then(joke => {
    console.log(joke);
    //alert('the joke is supposed to be:');
    const jokeElement = document.getElementById('responseDiv');
    jokeElement.innerHTML = joke;
});

// async function addJokeToDOM() {
//     jokeFromTheFunction = await getJokeFromAPI();
//     console.log('jokeFromTheFunction is', jokeFromTheFunction);
//     const jokeElement = document.getElementById('jokeElement');
//     jokeElement.innerHTML = jokeFromTheFunction;
    
// }

// //console.log('joke is', joke);

// addJokeToDOM();



//console.log(joke);
