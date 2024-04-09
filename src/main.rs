use actix_web::{middleware::DefaultHeaders, *};
use actix_cors::Cors;
use serde_json::*;
use serde::{Deserialize, Serialize};
use ml_library::network::Network;
use image::*;

#[get("/")]
async fn landing() -> impl Responder {
    HttpResponse::Ok().body("Hello World")
}

#[post("/echo")]
async fn echo(body: String) -> impl Responder {
    HttpResponse::Ok().body(body)
}

#[derive(Serialize, Deserialize, Debug)]
struct Image {
    pixels: Vec<u8>
}

#[post("/mnist")]
async fn mnist_handle(json: web::Json<Image>) -> impl Responder {
    let prediction = pass_to_nn(json.0);
    HttpResponse::Ok().json(prediction)
}

fn pass_to_nn(img: Image) -> Vec<String> {
    let mut nn = Network::from_load("testCNN");
    let data = reshape(&img.pixels);
    let buf = nn.conv_forward(vec![data]);
    let mut pred = buf
        .iter()
        .enumerate()
        .map(|(i, x)| (*x, i))
        .collect::<Vec<(f64, usize)>>();
    pred.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    pred.iter()
        .map(|x| format!("{}: {:.2}%", x.1, x.0 * 100.0))
        .collect::<Vec<String>>()
}

fn reshape(data: &Vec<u8>) -> Vec<Vec<f64>>{
    let dims = (data.len() as f64 / 4.0).sqrt() as usize;
    let mut output = vec![vec![0.0; 28]; 28];
    let mut c = 0;
    let mut img = DynamicImage::new_rgba8(dims as u32, dims as u32);
    for i in 0..dims {
        for j in 0..dims {
            let pix = (data[c] / 3 + data[c + 1] / 3 + data[c + 2] / 3);
            img.put_pixel(j as u32, i as u32, Rgba([pix, pix, pix, 255]));
            c += 4;
        }
    }
    let resized = img.resize(28, 28, imageops::FilterType::CatmullRom);
    for y in 0..28 {
        for x in 0..28 {
            let pix = resized.get_pixel(x as u32, y as u32).0;
            let int = (pix[0] / 3) + (pix[1] / 3) + (pix[2] / 3);
            output[y][x] = int as f64 / 255.0;
        }
    }
    output
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .wrap(Cors::default()
                .allow_any_header()
                .allow_any_origin()
                .allow_any_method()
            )
            .service(landing)
            .service(mnist_handle)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
