<h1 align="center">Student ID Card Generator API
</h1>

A Node.js API for generating customizable student ID cards with various templates and styles.

---

## Base URL

```
https://sicg.vercel.app
```

## Features

- 2 templates, 6 variants each
- 2 Hand Holding Templates
- Student Name
- College Name
- College Logo
- Student Photo
- Student ID
- Date of Birth
- Address
- Date of Issue
- Valid Until
- 130+ Country Supported
- PNG image or raw base64 output
- Support for both GET and POST requests

## API Endpoints

### Health Check
```
GET /health
```
Returns API information and available parameters.

### Generate ID Card
```
GET or POST : /gen
GET or POST : /handGen
```

## Simple Card `/gen` Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | **Yes** | - | Student name |
| `dob` | string | No | `2001-01-25` | Date of birth (format: YYYY-MM-DD) |
| `id` | string | No | `1` | ID format (`1` = numeric like 123-456-7890, `2` = alphanumeric like ABC123456789) |
| `id_value` | string | No | Auto-generated | Custom student ID (overrides auto-generation) |
| `academicyear` | string | No | `2025-2028` | Academic year |
| `country` | number | No | `0` | Country index (see Country ID Table below) |
| `template` | string | No | `1` | Template selection (`1` or `2`) |
| `style` | string | No | `2` | Style variant (`1` to `6`) |
| `opacity` | number | No | `0.1` | Center logo watermark opacity (0.0 to 1.0) |
| `principal` | string | No | `Osama Aziz` | Principal/Authority signature name |
| `student_photo` | string (URL) | No | Default photo | Student photo URL |
| `college_logo` | string (URL) | No | Default logo | College logo URL |
| `issue_date` | string | No | `15 AUG 2025` | Card issue date |
| `issue_txt` | string | No | `Date Of Issue` | Issue date label |
| `exp_date` | string | No | `31 DEC 2025` | Card expiration date |
| `exp_txt` | string | No | `Card Expires` | Expiration label (only for template 1) |
| `rawByte` | string | No | `2` | 2 = PNG image, 1 = raw byte JSON |


## Hand Holding `/handGen` Parameters

| Parameter      | Required | Default                                       | Description                    |
| -------------- | -------- | --------------------------------------------- | ------------------------------ |
| `schoolName`   | No       | Springfield Prep Charter School               | School name                    |
| `studentName`  | No       | JASON MILLER                                  | Student name                   |
| `studentEmail` | No       | [UN82728191@un.edu](mailto:UN82728191@un.edu) | Student email                  |
| `studentDept`  | No       | Physical Education Department                 | Department                     |
| `validThru`    | No       | DEC 2028                                      | Valid thru date                |
| `idNumber`     | No       | Auto-generated                                | Student ID                     |
| `schoolLogo`   | No       | —                                             | Logo URL or base64             |
| `studentPhoto` | No       | —                                             | Photo URL or base64            |
| `hand`         | No       | `1`                                           | Handwritten style (`1` or `2`) |
| `rawByte`      | No       | `2`                                           | `1` = base64 JSON response     |

## Country ID Table

Use the `country` parameter with the corresponding ID to select a university from a specific country:

| ID | Country | ID | Country | ID | Country |
|----|---------|----|---------|----|---------|
| 0 | Afghanistan | 46 | Guatemala | 92 | Peru |
| 1 | Albania | 47 | Guinea | 93 | Philippines |
| 2 | Algeria | 48 | Guyana | 94 | Poland |
| 3 | Argentina | 49 | Haiti | 95 | Portugal |
| 4 | Armenia | 50 | Honduras | 96 | Qatar |
| 5 | Australia | 51 | Hungary | 97 | Romania |
| 6 | Austria | 52 | Iceland | 98 | Russia |
| 7 | Azerbaijan | 53 | India | 99 | Saint Lucia |
| 8 | Bahamas | 54 | Indonesia | 100 | Samoa |
| 9 | Bahrain | 55 | Iran | 101 | San Marino |
| 10 | Bangladesh | 56 | Iraq | 102 | Saudi Arabia |
| 11 | Barbados | 57 | Ireland | 103 | Senegal |
| 12 | Belarus | 58 | Italy | 104 | Serbia |
| 13 | Belgium | 59 | Jamaica | 105 | Singapore |
| 14 | Bhutan | 60 | Japan | 106 | Somalia |
| 15 | Bolivia | 61 | Jordan | 107 | South Africa |
| 16 | Brazil | 62 | Kazakhstan | 108 | South Korea |
| 17 | Bulgaria | 63 | Kenya | 109 | South Sudan |
| 18 | Cambodia | 64 | Kosovo | 110 | Spain |
| 19 | Cameroon | 65 | Kuwait | 111 | Sri Lanka |
| 20 | Canada | 66 | Kyrgyzstan | 112 | Sudan |
| 21 | Central African Republic | 67 | Laos | 113 | Sweden |
| 22 | Chile | 68 | Latvia | 114 | Switzerland |
| 23 | China | 69 | Lebanon | 115 | Syria |
| 24 | Colombia | 70 | Liberia | 116 | Taiwan |
| 25 | Comoros | 71 | Libya | 117 | Tajikistan |
| 26 | Costa Rica | 72 | Lithuania | 118 | Tanzania |
| 27 | Côte d'Ivoire | 73 | Luxembourg | 119 | Thailand |
| 28 | Croatia | 74 | Madagascar | 120 | Togo |
| 29 | Denmark | 75 | Malaysia | 121 | Trinidad and Tobago |
| 30 | Dominica | 76 | Maldives | 122 | Tunisia |
| 31 | Dominican Republic | 77 | Mexico | 123 | Turkey |
| 32 | Ecuador | 78 | Monaco | 124 | Turkmenistan |
| 33 | Egypt | 79 | Mongolia | 125 | Uganda |
| 34 | El Salvador | 80 | Morocco | 126 | Ukraine |
| 35 | Eritrea | 81 | Myanmar | 127 | United Arab Emirates |
| 36 | Estonia | 82 | Namibia | 128 | United Kingdom |
| 37 | Ethiopia | 83 | Nepal | 129 | United States |
| 38 | Finland | 84 | Netherlands | 130 | Uruguay |
| 39 | France | 85 | New Zealand | 131 | Uzbekistan |
| 40 | Gambia | 86 | Nigeria | 132 | Vatican City |
| 41 | Georgia | 87 | North Korea | 133 | Venezuela |
| 42 | Germany | 88 | Norway | 134 | Vietnam |
| 43 | Ghana | 89 | Oman | 135 | Yemen |
| 44 | Greece | 90 | Pakistan | 136 | Zambia |
| 45 | Grenada | 91 | Panama | 137 | Zimbabwe |

## Usage Examples

Why do you need example code, huh?😡 Bruh I’m not providing any example code.
bcz if you’re planning to use or deploy this API, you should already know what you’re doing.

If you need copy paste examples to figure it out, this probably isnt for you yet.

Docs are here. Endpoints are here.
The rest is called experience. Good luck😴


## Template & Style Preview

- **Template 1:** Classic design with red accents
- **Template 2:** Modern design with shadow effects
- **Styles 1-6:** Different color schemes and layouts for each template
- **Hand:** Hand Holding Id Card Templates

## Technical Details

- **Built with:** Node.js, Express.js, Canvas
- **Image Processing:** node-canvas library
- **Fonts:** Times, AlexBrush
- **Deployment:** Vercel

***

**API Version:** 2.0.0
**Last Updated:** February 2026
