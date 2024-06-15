for (i = 0; i < 10; i++) {
    document.querySelector("ul").innerHTML += "<li id='l" + i + "'>" + i + ": " + "0.00%</li>";
    let int = 100 * (i / 10);
    document.getElementById("l" + i).style.color = "rgb(" + int + ", " + int + ", " + int   + ")";
}

const canvas = document.getElementById('canvas');
canvas.height = screen.height * (5/10);
canvas.width = screen.height * (5/10);
const rect = canvas.getBoundingClientRect();
const ctx = canvas.getContext('2d', {
    willReadFrequently: true
});
ctx.strokeStyle = 'white';
ctx.lineWidth = 10;

let isDrawing = false;

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseleave', endDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', endDrawing);

document.getElementById("clear").addEventListener("click", function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function startDrawing(event) {
    isDrawing = true;
    draw(event);
}

function draw(event) {
    if (!isDrawing) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    send_drawing();
}

function endDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function send_drawing() { 
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    let pixelArray = Array.from(data.data.values());
    let postData = {
        pixels: pixelArray
    };
    $.ajax({
        url: 'http://localhost:8080/mnist',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(postData),
        success: function(response) {
          console.log('Success:', response);
          flush_predictions(response);
        },
        error: function(xhr, status, error) {
          console.error('Error:', error);
        }
      });

};

function flush_predictions(predictions) {
    document.querySelector("ul").innerHTML = "";
    for(i = 0; i < predictions.length; i++) {
        document.querySelector("ul").innerHTML += "<li id='l" + i + "'>" + predictions[i] + "</li>";
        let int = 100 * (i / 10);
        document.getElementById("l" + i).style.color = "rgb(" + int + ", " + int + ", " + int   + ")";
    }
}

function downloadImage(data, filename = 'untitled.jpeg') {
    var a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
}

function scaleImageData(imageData, width) {
    let scale = width / imageData.width;
    var scaled = ctx.createImageData(imageData.width * scale, imageData.height * scale);

    for(var row = 0; row < imageData.height; row++) {
        for(var col = 0; col < imageData.width; col++) {
        var sourcePixel = [
            imageData.data[(row * imageData.width + col) * 4 + 0],
            imageData.data[(row * imageData.width + col) * 4 + 1],
            imageData.data[(row * imageData.width + col) * 4 + 2],
            imageData.data[(row * imageData.width + col) * 4 + 3]
        ];
        for(var y = 0; y < scale; y++) {
            var destRow = row * scale + y;
            for(var x = 0; x < scale; x++) {
            var destCol = col * scale + x;
            for(var i = 0; i < 4; i++) {
                scaled.data[(destRow * scaled.width + destCol) * 4 + i] =
                sourcePixel[i];
            }
            }
        }
        }
    }


    return scaled;
}
