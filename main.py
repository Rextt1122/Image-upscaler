import subprocess
import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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
async def upscale_image(
    file: UploadFile = File(...), 
    scale: str = Form("4"),
    model: str = Form("realesrgan-x4plus")
):
    unique_id = str(uuid.uuid4())[:8] # Short suffix
    original_name = os.path.splitext(file.filename)[0]
    ext = os.path.splitext(file.filename)[1] or ".png"
    input_path = f"in_{unique_id}{ext}"
    
    output_filename = f"{original_name}_upscaled_{scale}x.png"
    output_path = os.path.join(RESULT_DIR, output_filename)
    
    try:
        content = await file.read()
        with open(input_path, "wb") as buffer:
            buffer.write(content)

        exe_path = os.path.join(os.path.dirname(__file__), "realesrgan-ncnn-vulkan.exe")
        command = [
            exe_path, 
            "-i", input_path, 
            "-o", output_path, 
            "-n", model,
            "-s", scale 
        ]
        
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0:
            return {"error": result.stderr or result.stdout or "Unknown EXE error"}
            
        return FileResponse(output_path)
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(input_path):
            try: os.remove(input_path)
            except: pass

app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)