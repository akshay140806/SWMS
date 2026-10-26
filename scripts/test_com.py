import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import win32com.client
import os

print("Testing python-docx and Word COM...")
doc = Document()
p = doc.add_paragraph("Test Paragraph")
doc.save("test_sample.docx")

word = win32com.client.Dispatch("Word.Application")
word.Visible = False
in_file = os.path.abspath("test_sample.docx")
out_file = os.path.abspath("test_sample.pdf")
doc_com = word.Documents.Open(in_file)
doc_com.SaveAs(out_file, FileFormat=17) # 17 = wdFormatPDF
doc_com.Close()
word.Quit()
print("PDF created successfully:", os.path.exists(out_file))
