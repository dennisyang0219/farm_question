import sys

def main():
    pdf_path = "農會法+細則20260907.pdf"
    
    # Try pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        print(f"pypdf: Total pages = {len(reader.pages)}")
        full_text = ""
        for i, page in enumerate(reader.pages):
            full_text += f"\n--- Page {i+1} ---\n" + page.extract_text()
        with open("pdf_text.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        print("Successfully extracted with pypdf, saved to pdf_text.txt")
        return
    except Exception as e:
        print("pypdf failed:", e)

    # Try PyMuPDF / fitz
    try:
        import fitz
        doc = fitz.open(pdf_path)
        print(f"fitz: Total pages = {len(doc)}")
        full_text = ""
        for i, page in enumerate(doc):
            full_text += f"\n--- Page {i+1} ---\n" + page.get_text()
        with open("pdf_text.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        print("Successfully extracted with PyMuPDF, saved to pdf_text.txt")
        return
    except Exception as e:
        print("fitz failed:", e)

    # Try pdfplumber
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for i, page in enumerate(pdf.pages):
                full_text += f"\n--- Page {i+1} ---\n" + page.extract_text()
            with open("pdf_text.txt", "w", encoding="utf-8") as f:
                f.write(full_text)
            print("Successfully extracted with pdfplumber, saved to pdf_text.txt")
            return
    except Exception as e:
        print("pdfplumber failed:", e)

    # Try pypdf2
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(pdf_path)
        print(f"PyPDF2: Total pages = {len(reader.pages)}")
        full_text = ""
        for i, page in enumerate(reader.pages):
            full_text += f"\n--- Page {i+1} ---\n" + page.extract_text()
        with open("pdf_text.txt", "w", encoding="utf-8") as f:
            f.write(full_text)
        print("Successfully extracted with PyPDF2, saved to pdf_text.txt")
        return
    except Exception as e:
        print("PyPDF2 failed:", e)

if __name__ == "__main__":
    main()
