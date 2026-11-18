# Hướng Dẫn Huấn Luyện (Fine-tune) & Vận Hành `Qwen3-8B` Tốc Độ Cao Trên Google Colab + Hugging Face Hub

Tài liệu này hướng dẫn quy trình **huấn luyện mô hình ngôn ngữ lớn mã nguồn mở `Qwen3-8B` bằng kỹ thuật QLoRA (4-bit) kết hợp `train_on_responses_only` và `enable_thinking=False`**, lưu trữ trực tiếp trên **Hugging Face Hub**, và khởi chạy **AI Server tốc độ cao trên Google Colab GPU (16GB VRAM)** kết nối với Backend NestJS.

---

## 1. Cấu trúc thư mục `docs/ai-training`

| File | Mục đích |
| :--- | :--- |
| [`dataset_qwen3_ai_tutor_vn.jsonl`](./dataset_qwen3_ai_tutor_vn.jsonl) | Bộ dữ liệu chuẩn ChatML (**136 kịch bản sư phạm độc lập**) bao phủ toàn diện cả **Khoa học Tự nhiên** (Toán, Vật lí, Hóa học, Sinh học, Tin học, Công nghệ) và **Khoa học Xã hội & Nhân văn** (Ngữ văn, Lịch sử & Địa lí, Tiếng Anh, Giáo dục công dân) từ Lớp 6 đến Lớp 9 theo 7 nhóm kỹ năng: (1) Hỏi mở lộ trình học tập 32 môn/khối; (2) Giải bài tập Tự nhiên cơ bản & nâng cao; (3) Phân tích chuyên sâu các môn Xã hội; (4) Giải chi tiết 32 chuyên đề bồi dưỡng HSG; (5) Hội thoại đa lượt (Multi-turn) sửa lỗi sai cho học sinh; (6) Negative RAG & Chống Prompt Injection; (7) Sinh đề trắc nghiệm chuẩn JSON. |
| [`1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb`](./1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb) | Notebook chạy trên Google Colab (T4 GPU) để Fine-tune `unsloth/Qwen3-8B-unsloth-bnb-4bit` với chế độ `enable_thinking=False` (tắt `<think>` rườm rà giúp trả lời nhanh gấp 2–3 lần) và `train_on_responses_only` (chỉ tính hàm Loss trên phần trả lời của AI), vẽ biểu đồ `Training Loss` và đẩy thẳng file nén `GGUF (q4_k_m)` lên Hugging Face Hub. |
| [`2_Run_Qwen3_8B_Server_on_Colab.ipynb`](./2_Run_Qwen3_8B_Server_on_Colab.ipynb) | Notebook chạy AI Server (`Qwen3-8B` + Embedding `BAAI/bge-m3`) với cấu hình tăng tốc phần cứng (`OLLAMA_FLASH_ATTENTION=1`, `OLLAMA_KV_CACHE_TYPE=q8_0`, Warm-up VRAM `keep_alive=24h`) và xuất đường link HTTPS công khai (`trycloudflare.com`) để gắn vào `code/backend/.env`. |

---

## 2. Quy trình thực hiện từng bước

### Bước 1: Huấn luyện và Lưu mô hình lên Hugging Face Hub (Chỉ cần làm 1 lần — ~25-30 phút)
1. Truy cập https://huggingface.co/settings/tokens, tạo một **Access Token** với quyền **`Write`**.
2. Truy cập https://colab.research.google.com, chọn **Upload** và tải file [`1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb`](./1_FineTune_Qwen3_8B_Colab_to_HuggingFace.ipynb) lên.
3. Trên thanh menu của Colab, chọn **Runtime $\rightarrow$ Change runtime type $\rightarrow$ T4 GPU**.
4. Tải file [`dataset_qwen3_ai_tutor_vn.jsonl`](./dataset_qwen3_ai_tutor_vn.jsonl) vào cột **Files** (biểu tượng thư mục bên trái của Colab) để Notebook tự động gộp toàn bộ 21 kịch bản nâng cao vào tập huấn luyện.
5. Ở **Bước 6** trong Notebook, điền `HF_TOKEN` của bạn rồi bấm **Run All**.
6. Sau khi chạy xong:
   - Lưu lại ảnh biểu đồ **Training Loss** ở Bước 4 và tốc độ kiểm thử ở Bước 5 để đưa vào quyển Báo cáo Đồ án tốt nghiệp.
   - Mô hình đã được lưu vĩnh viễn tại `https://huggingface.co/<HF_USERNAME>/qwen3-8b-ai-tutor-vn`.

---

### Bước 2: Bật AI Server tốc độ cao trên Google Colab & Kết nối vào Backend NestJS (~2 phút)
Mỗi khi bạn ngồi code hoặc khi đi thuyết trình bảo vệ Đồ án:
1. Mở file [`2_Run_Qwen3_8B_Server_on_Colab.ipynb`](./2_Run_Qwen3_8B_Server_on_Colab.ipynb) trên Google Colab (chọn **T4 GPU**).
2. Ở **Bước 2** của Notebook:
   - Nếu đã train xong repo riêng trên Hugging Face, đặt `HF_GGUF_MODEL = "hf.co/<HF_USERNAME>/qwen3-8b-ai-tutor-vn:Q4_K_M"`.
   - Nếu muốn chạy thử ngay lập tức trước khi train, script sẽ tự động dùng `qwen3:8b` và đóng gói cùng `Modelfile` tối ưu tốc độ.
3. Chạy hết 3 ô lệnh. Ô thứ 3 sẽ in ra cấu hình `.env` có dạng:
   ```env
   AI_PROVIDER="OLLAMA"
   OLLAMA_BASE_URL="https://xxxx-yyyy.trycloudflare.com"
   OLLAMA_MODEL="qwen3-8b-ai-tutor-vn"
   OLLAMA_EMBEDDING_MODEL="bge-m3"
   ```
4. Copy 4 dòng trên dán vào file `code/backend/.env` trên laptop và khởi động lại Backend (`npm run start:dev`).
