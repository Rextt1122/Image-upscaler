import subprocess
import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

RESULT_DIR = "results"
if not os.path.exists(RESULT_DIR):
    os.makedirs(RESULT_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upscale")
async def upscale_image(file: UploadFile = File(...), scale: str = Form("4")):
    unique_id = str(uuid.uuid4())
    input_path = f"in_{unique_id}.png"
    
    output_filename = f"upscaled_{scale}x_{unique_id}.png"
    output_path = os.path.join(RESULT_DIR, output_filename)
    
    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())

    command = [
        "realesrgan-ncnn-vulkan.exe", 
        "-i", input_path, 
        "-o", output_path, 
        "-n", "realesrgan-x4plus",
        "-s", scale 
    ]
    
    try:
        subprocess.run(command, check=True)
        if os.path.exists(input_path):
            os.remove(input_path)
        return FileResponse(output_path)
    except Exception as e:
        if os.path.exists(input_path):
            os.remove(input_path)
        return {"error": str(e)}