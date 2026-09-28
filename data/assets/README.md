# 📸 Yearbook PDF Assets

Place your photos in this folder. The PDF generator will automatically pick them up.

## Required Files

| File Name | Used On | Description |
|---|---|---|
| `IT Logo.jpg` | Cover, all header bars | Department/Institute logo |
| `Maharaja_Agrasen_Institute_of_Technology.jpg` | Cover, closing page | Campus/building photo |
| `12_IT_DEPARTMENT_Faculties_Staff.jpg` | Department page | Faculty & staff group photo |
| `year book.jpg` | Department page | Yearbook/community photo |
| `back page.jpeg` | Closing page | Small campus photo |

## New Front-Matter Pages

| File Name | Used On | Description |
|---|---|---|
| `department_photo.jpg` | **About Department** page | Department group/campus photo (large, top of page) |
| `hod_photo.jpg` | **Message from HOD** page | HOD portrait photo (Dr. Amita Goel) |
| `editorial_1.jpg` | **Editorial Board** page | Dr Vibhor Sharma (Faculty Advisor) |
| `editorial_2.jpg` | **Editorial Board** page | Krish Vishwakarma (Editor-in-Chief) |
| `editorial_3.jpg` | **Editorial Board** page | Shubham Raj (Co-Editor) |

## Notes

- **Format**: JPG/JPEG preferred. PNG also works.
- **Size**: Any resolution works — the PDF generator automatically crops and resizes.
- **Orientation**: Portrait photos (taller than wide) work best for HOD and editorial board member photos.
- **If a file is missing**: The PDF will show a placeholder with initials instead — it won't break.
- **Editorial board**: If you add more members to `_DEFAULT_EDITORIAL_BOARD` in `python_code_pdf.py`, add corresponding `editorial_4.jpg`, `editorial_5.jpg`, etc.
