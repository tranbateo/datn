# Hướng Dẫn Huấn Luyện (Fine-tune) & Vận Hành `Qwen3-8B` Trên Google Colab + Hugging Face Hub

Tài liệu này hướng dẫn quy trình **huấn luyện mô hình ngôn ngữ lớn mã nguồn mở `Qwen3-8B` bằng kỹ thuật QLoRA (4-bit)**, lưu trữ trực tiếp trên **Hugging Face Hub**, và khởi chạy **AI Server trên Google Colab GPU (16GB VRAM)** kết nối với Backend NestJS mà **không tiêu tốn ổ cứng hay RAM/VRAM trên laptop cá nhân**.

---

## 1. Cấu trúc thư mục `docs/ai-training`

| File | Mục đích |
| :--- | :--- |
| [`dataset_qwen3_ai_tutor_vn.jsonl`](./dataset_qwen3_ai_tutor_vn.jsonl) | Bộ dữ liệu mẫu định dạng ChatML dạy `Qwen3-8B` 4 kỹ năng: (1) Đọc tài liệu RAG có trích dẫn; (2) Giải bài tập Toán/Lý mới tương tự dạng bài mẫu trong tài liệu; (3) Từ chối câu hỏi ngoài môn học / chống Prompt Injection; (4) Sinh câu hỏi trắc nghiệm chuẩn JSON. |
| [`1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb`](./1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb) | Notebook chạy trên Google Colab (T4 GPU) để Fine-tune `unsloth/Qwen3-8B-unsloth-bnb-4bit`, vẽ biểu đồ `Training Loss` và đẩy thẳng file nén `GGUF (q4_k_m)` lên Hugging Face Hub. |
| [`2_Run_Qwen3_8B_Server_on_Colab.ipynb`](./2_Run_Qwen3_8B_Server_on_Colab.ipynb) | Notebook chạy AI Server (`Qwen3-8B` + Embedding `BAAI/bge-m3`) trên Google Colab và xuất đường link HTTPS công khai (`trycloudflare.com`) để gắn vào `code/backend/.env`. |

---

## 2. Quy trình thực hiện từng bước

### Bước 1: Huấn luyện và Lưu mô hình lên Hugging Face Hub (Chỉ cần làm 1 lần — ~30 phút)
1. Truy cập https://huggingface.co/settings/tokens, tạo một **Access Token** với quyền **`Write`**.
2. Truy cập https://colab.research.google.com, chọn **Upload** và tải file [`1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb`](./1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb) lên.
3. Trên thanh menu của Colab, chọn **Runtime $\rightarrow$ Change runtime type $\rightarrow$ T4 GPU**.
4. *(Tùy chọn)* Nếu muốn bổ sung thêm nhiều bài tập mẫu, bạn tải file [`dataset_qwen3_ai_tutor_vn.jsonl`](./dataset_qwen3_ai_tutor_vn.jsonl) vào cột Files bên trái của Colab.
5. Ở **Bước 6** trong Notebook, điền `HF_USERNAME` và `HF_TOKEN` của bạn rồi bấm **Run All**.
6. Sau khi chạy xong:
   - Lưu lại ảnh biểu đồ **Training Loss** ở Bước 4 để đưa vào quyển Báo cáo Đồ án tốt nghiệp.
   - Mô hình đã được lưu vĩnh viễn tại `https://huggingface.co/<HF_USERNAME>/qwen3-8b-ai-tutor-vn`.

---

### Bước 2: Bật AI Server trên Google Colab & Kết nối vào Backend NestJS (~2 phút)
Mỗi khi bạn ngồi code hoặc khi đi thuyết trình bảo vệ Đồ án:
1. Mở file [`2_Run_Qwen3_8B_Server_on_Colab.ipynb`](./2_Run_Qwen3_8B_Server_on_Colab.ipynb) trên Google Colab (chọn **T4 GPU**).
2. Ở **Bước 2** của Notebook:
   - Nếu đã train xong repo riêng trên Hugging Face, đổi `HF_GGUF_MODEL = "hf.co/<HF_USERNAME>/qwen3-8b-ai-tutor-vn:Q4_K_M"`.
   - Nếu muốn chạy thử ngay lập tức trước khi train, giữ nguyên `HF_GGUF_MODEL = "qwen3:8b"`.
3. Chạy hết 3 ô lệnh. Ô thứ 3 sẽ in ra cấu hình `.env` có dạng:
   ```env
   AI_PROVIDER="OLLAMA"
   OLLAMA_BASE_URL="https://xxxx-yyyy.trycloudflare.com"
   OLLAMA_MODEL="qwen3-8b-ai-tutor-vn"
   OLLAMA_EMBEDDING_MODEL="bge-m3"
   ```
4. Copy 4 dòng trên dán vào file `code/backend/.env` trên laptop và khởi động lại Backend (`npm run start:dev`).
