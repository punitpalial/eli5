

const word = 'naya hai bhai';

setTimeout(() => {
    const responseDiv = document.getElementById('responseDiv');
    responseDiv.innerHTML = "Worked";
}, 2000);


chrome.runtime.sendMessage({ greeting: "hello" }, function(response) {
    console.log(response.farewell);
});

