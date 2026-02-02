const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});



registerFont(path.join(__dirname, 'public/times.ttf'), { family: 'Times' });
registerFont(path.join(__dirname, 'public/times.ttf'), { family: 'Arial' });
registerFont(path.join(__dirname, 'public/AlexBrush-Regular.ttf'), { family: 'AlexBrush' });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));




async function generateCode128Barcode(data, width, height) {
    try {
        const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: String(data),
            scale: 3,
            height: 12,
            includetext: false,
            padding: 10,
            backgroundcolor: 'CDCDCF'
        });

        const img = await loadImage(png);

        if (!img) {
            throw new Error('loadImage() returned null');
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        return canvas;
    } catch (err) {
        console.error('Barcode generation failed:', err);
        return null;
    }
}

function splitSchoolName(name) {
    name = name.trim();
    if (name.length <= 16) return [name];

    const words = name.split(' ');
    if (words.length === 1) return [name];

    const firstTwoWordsLen = words[0].length + 1 + words[1].length;

    if (firstTwoWordsLen > 16) {
        return [words[0] + ' ' + words[1], words.slice(2).join(' ')];
    } else {
        let line1 = words[0];
        let idx = 1;
        while (idx < words.length && (line1.length + 1 + words[idx].length) <= 16) {
            line1 += ' ' + words[idx];
            idx++;
        }
        return [line1, words.slice(idx).join(' ')];
    }
}


function drawRotated(ctx, x, y, angleDeg, drawFn) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angleDeg * Math.PI / 180);
    drawFn(ctx);
    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function generateRandomID() {
    let digits = "";
    for (let i = 0; i < 6; i++) digits += Math.floor(Math.random() * 10);
    return "UN" + digits;
}

async function loadImageFromSource2(source) {
    if (!source) return null;
    
    try {
        if (source.startsWith('http://') || source.startsWith('https://')) {
            
            const response = await fetch(source);
            const arrayBuffer = await response.arrayBuffer();
            return await loadImage(Buffer.from(arrayBuffer));
        } else if (source.startsWith('data:image')) {
            const base64Data = source.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            return await loadImage(buffer);
        } else {
            
            return await loadImage(source);
        }
    } catch (error) {
        console.error('Failed to load image:', error);
        return null;
    }
}

async function generateCard2(params) {
    const publicPath = path.join(__dirname, '..', 'public');
    
    
    const templateImg = await loadImage('public/card.png');
    const canvas = createCanvas(templateImg.width, templateImg.height);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(templateImg, 0, 0);

    
    const defaultLogoImg = await loadImage('public/logo.png');
    const defaultStudentImg = await loadImage('public/student.png');

    
    let schoolLogoImg = defaultLogoImg;
    if (params.schoolLogo) {
        const customLogo = await loadImageFromSource2(params.schoolLogo);
        if (customLogo) schoolLogoImg = customLogo;
    }

    
    let studentPhotoImg = defaultStudentImg;
    if (params.studentPhoto) {
        const customPhoto = await loadImageFromSource2(params.studentPhoto);
        if (customPhoto) studentPhotoImg = customPhoto;
    }

    // school logo
    drawRotated(ctx, 210, 120, 0, (ctx) => {
        const W = 150, H = 100, inset = 0, radius = 0;
        roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, radius);
        ctx.clip();
        ctx.drawImage(schoolLogoImg, 0, 0, schoolLogoImg.width, schoolLogoImg.height, inset, inset, W - inset * 2, H - inset * 2);
    });

    // school name
    const schoolName = params.schoolName || 'Springfield Prep Charter School';
    const schoolNameLines = splitSchoolName(schoolName);
    drawRotated(ctx, 390, 130, 0, (ctx) => {
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "bold 46px Arial";
        ctx.fillText(schoolNameLines[0], 0, 0);
        if (schoolNameLines.length > 1 && schoolNameLines[1].trim() !== "") {
        	ctx.fillStyle = "#809D55";
            ctx.font = "bold 33px Arial";
            ctx.fillText(schoolNameLines[1], 0, 49);
        }
    });

    // student photo
    drawRotated(ctx, 332, 256, -0.2, (ctx) => {
        const W = 328, H = 385, inset = 12, radius = 10;
        roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, radius);
        ctx.clip();
        ctx.drawImage(studentPhotoImg, 0, 0, studentPhotoImg.width, studentPhotoImg.height, inset, inset, W - inset * 2, H - inset * 2);
    });

    // student name
    const studentName = params.studentName || 'JASON MILLER';
    drawRotated(ctx, 490, 710, 0, (ctx) => {
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "bold 56px Arial";
        ctx.fillText(studentName.toUpperCase(), 0, 0);
    });
    
  /*
  const studentDob = params.studentDob || '17-05-2001';
    drawRotated(ctx, 390, 748, 0, (ctx) => {
        ctx.fillStyle = "#C4C6D3";
        // ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.font = "34px Arial";
        ctx.fillText(studentDob, 0, 0);
    });
    */

    // student email
    const studentEmail = params.studentEmail || 'UN82728191@un.edu';
    drawRotated(ctx, 395, 750, 0, (ctx) => {
        ctx.fillStyle = "#C4C6D3";
        // ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "34px Arial";
        ctx.fillText(studentEmail, 0, 0);
    });

    // student department
    drawRotated(ctx, 280, 790, 0, (ctx) => {
        ctx.fillStyle = "#C4C6D3";
        // ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const studentDept = params.studentDept || 'Physical Education Department';
        ctx.font = "bold 34px Arial";
        ctx.fillText(studentDept, 0, 0);
    });

    // valid thru
    const validThru = params.validThru || 'DEC 2028';
    drawRotated(ctx, 320, 830, 0, (ctx) => {
        ctx.fillStyle = "#8D9D76";
        // ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "bold 34px Arial";
        ctx.fillText(`VALID THRU: ${validThru}`, 0, 0);
    });

    // barcode
    const idNumber = params.idNumber || generateRandomID();
    const barcodeData = JSON.stringify({
        name: studentName,
        department: params.studentDept || 'Physical Education Department',
        idNumber: idNumber,
        email: studentEmail,
        schoolName: schoolName
    });

    const barcodeCanvas = await generateCode128Barcode(
    idNumber,
    485,
    100
);

if (barcodeCanvas instanceof Object && barcodeCanvas.getContext) {
    drawRotated(ctx, 262, 860, 0, (ctx) => {
        ctx.drawImage(barcodeCanvas, 0, 0);
    });
} else {
    console.error('Invalid barcodeCanvas:', barcodeCanvas);
}


    // ID number
    drawRotated(ctx, 400, 1000, 0, (ctx) => {
        ctx.fillStyle = "#38393D";
        // ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "bold 32px Arial";
        ctx.fillText(`ID: ${idNumber}`, 0, 0);
    });

    return canvas;
}

const HAND_CONFIG = {
    1: {
        image: 'public/hand1.png',
        x: 177,
        y: 53,
        w: 828,
        h: 850,
        rotate: 5.8
    },
    2: {
        image: 'public/hand2.png',
        x: 158,
        y: 86,
        w: 774,
        h: 820,
        rotate: -1
    }
};


async function generateCardInHand(cardCanvas, handType = 1) {
    const cfg = HAND_CONFIG[handType] || HAND_CONFIG[1];

    const handImg = await loadImage(cfg.image);

    const canvas = createCanvas(handImg.width, handImg.height);
    const ctx = canvas.getContext('2d');

    // hand
    ctx.drawImage(handImg, 0, 0);

    // Card
    const cardImg = await loadImage(cardCanvas.toBuffer());

    // card
    drawRotated(ctx, cfg.x, cfg.y, cfg.rotate, (ctx) => {
        const inset = 0;
        const radius = 0;

        roundRect(ctx, inset, inset, cfg.w, cfg.h, radius);
        ctx.clip();

        ctx.drawImage(
            cardImg,
            0,
            0,
            cardImg.width,
            cardImg.height,
            inset,
            inset,
            cfg.w,
            cfg.h
        );
    });

    return canvas;
}


app.all('/handGen', async (req, res) => {
    try {
        const params = req.method === 'GET' ? req.query : req.body;

        
        const cardCanvas = await generateCard2(params);

        let outputCanvas = cardCanvas;

        
        if (params.hand == 1 || params.hand == 2) {
            outputCanvas = await generateCardInHand(
                cardCanvas,
                Number(params.hand)
            );
        }

        const buffer = outputCanvas.toBuffer('image/png');

        
        if (params.rawByte == 1) {
            return res.json({
                success: true,
                type: "raw-bytes",
                format: "image/png",
                size: buffer.length,
                data: buffer.toString('base64')
            });
        }

        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader(
            'Content-Disposition',
            'inline; filename="id_card.png"'
        );
        res.send(buffer);

    } catch (error) {
        console.error('Error generating card:', error);
        res.status(500).json({
            error: 'Failed to generate ID card',
            message: error.message
        });
    }
});



//////////// OLD TEMPS

// Load clg data
let colleges = {};
try {
    colleges = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/collegeWa.json'), 'utf8'));
} catch (error) {
    console.error('Error loading college data:', error);
}

// hlper
async function loadImageFromSource(source) {
    if (source && source.startsWith('http')) {
        const response = await axios.get(source, { responseType: 'arraybuffer' });
        return await loadImage(Buffer.from(response.data));
    } else if (source) {
        return await loadImage(source);
    }
    return null;
}

// Generate function
function generateStudentId(format) {
    if (format === '1' || format === 1) {
        const part1 = Math.floor(Math.random() * 900 + 100);
        const part2 = Math.floor(Math.random() * 900 + 100);
        const part3 = Math.floor(Math.random() * 9000 + 1000);
        return `${part1}-${part2}-${part3}`;
    } else {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 3; i++) {
            result += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 9; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Main gneration
async function generateCard(params, set) {
    const canvas = createCanvas(1280, 804);
    const ctx = canvas.getContext('2d');


    const styleIndex = parseInt(params.style || '2') - 1;
    const templates1 = ['public/temp1.png', 'public/temp2.png', 'public/temp3.png', 
                       'public/temp4.png', 'public/temp5.png', 'public/temp6.png'];
    const templates2 = ['public/temp2_1.png', 'public/temp2_2.png', 'public/temp2_3.png',
                       'public/temp2_4.png', 'public/temp2_5.png', 'public/temp2_6.png'];
    
    const templateSrc = set === 'set2' ? templates2[styleIndex] : templates1[styleIndex];

    // tmplates
    const templateImage = await loadImage(templateSrc);
    ctx.drawImage(templateImage, 0, 0, 1280, 804);

    // clg logo
    const logoSrc = params.college_logo || 'public/college_logo.png';
    const collegeLogo = await loadImageFromSource(logoSrc);
    
    if (collegeLogo) {
        if (set === 'set2') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.drawImage(collegeLogo, 433, 177, 102, 102);
        } else {
            ctx.drawImage(collegeLogo, 15, 49, 165, 165);
        }
    }

    // stdnt pic
    const studentPhotoSrc = params.student_photo || 'public/default_student.png';
    const studentPhoto = await loadImageFromSource(studentPhotoSrc);
    
    if (studentPhoto) {
        const x = set === 'set2' ? 67 : 155;
        const y = set === 'set2' ? 179 : 227;
        const size = set === 'set2' ? 282 : 348;
        const radius = size / 2;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + radius, y + radius, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(studentPhoto, x, y, size, size);
        ctx.restore();
    }

    // center icon
    if (collegeLogo) {
        ctx.save();
        const opacity = parseFloat(params.opacity || '0.1');
        ctx.globalAlpha = opacity;
        const iconWidth = 620;
        const iconHeight = 620;
        const centerX = (canvas.width - iconWidth) / 2;
        const centerY = (canvas.height - iconHeight) / 2;
        ctx.drawImage(collegeLogo, centerX, centerY, iconWidth, iconHeight);
        ctx.restore();
    }

    // clg info
    const countryIndex = parseInt(params.country || '0');
const countries = Object.keys(colleges);
const selectedCountry = countries[countryIndex] || countries[0];

const collegeData = colleges[selectedCountry] ? colleges[selectedCountry][0] : null;

const hasCustomName = typeof params.clgName === 'string' && params.clgName.trim() !== '';
const hasCustomAdd  = typeof params.clgAdd === 'string' && params.clgAdd.trim() !== '';

const collegeName = (hasCustomName && hasCustomAdd)
    ? params.clgName.trim()
    : (collegeData ? collegeData.name : 'Westminster International University in Tashkent');

const address = (hasCustomName && hasCustomAdd)
    ? params.clgAdd.trim()
    : (collegeData ? collegeData.address : '628, Kanaikhali, Natore');


    // dob format
   // const formattedDate = formatDate(params.dob || '2001-01-25');
   
   const formattedDate = params.dob || '2001-01-25';

    // Draw text based on tmplate
    if (set === 'set2') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 52px Times';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText((params.name || 'Mark Zuckerberg').toUpperCase(), 85, 750);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Times';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(formattedDate, 715, 428);
        
        const studentId = params.id_value || generateStudentId(params.id || '1');
        ctx.fillText(studentId, 715, 359);
        ctx.fillText(address.substring(0, 30), 715, 490);
        ctx.fillText(params.academicyear || '2025-2028', 715, 553);
        ctx.fillText(params.exp_date || '31 DEC 2025', 715, 620);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Times';
        ctx.fillText(params.issue_date || '15 AUG 2025', 1050, 80);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Times';
        ctx.fillText(params.issue_txt || 'Date Of Issue', 1005, 40);
    } else {
        ctx.fillStyle = '#F45245';
        ctx.font = 'bold 52px Times';
        ctx.fillText((params.name || 'Mark Zuckerberg').toUpperCase(), 625, 402);
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 31px Times';
        ctx.fillText(formattedDate, 808, 512);
        
        const studentId = params.id_value || generateStudentId(params.id || '1');
        ctx.fillText(studentId, 810, 462);
        ctx.fillText(address.substring(0, 30), 810, 557);
        
        ctx.fillStyle = '#F45245';
        ctx.font = 'bold 45px Times';
        ctx.fillText(params.academicyear || '2025-2028', 665, 694);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px Times';
        ctx.fillText(params.issue_date || '15 AUG 2025', 1050, 80);
        ctx.fillText(params.exp_date || '31 DEC 2025', 65, 785);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Times';
        ctx.fillText(params.issue_txt || 'Date Of Issue', 1005, 40);
        ctx.font = 'bold 34px Times';
        ctx.fillText(params.exp_txt || 'Card Expires', 10, 745);
    }

    // clg name
    ctx.fillStyle = set === 'set2' ? '#FFFFFF' : '#000000';
    ctx.font = 'bold 32px Times';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    const college = collegeName.toUpperCase();
    const words = college.split(' ');
    let line1 = '';
    let line2 = '';
    let line1Full = false;

    for (let word of words) {
        if (!line1Full) {
            const testLine = line1 ? line1 + ' ' + word : word;
            if (testLine.length <= 28) {
                line1 = testLine;
            } else {
                line1Full = true;
                line2 = word;
            }
        } else {
            line2 += (line2 ? ' ' : '') + word;
        }
    }

    const xOffset = set === 'set2' ? 380 : 0;
    const yOffset = set === 'set2' ? 110 : 0;

    if (!line2) {
        ctx.fillText(line1, 165 + xOffset, 130 + yOffset);
    } else {
        ctx.fillText(line1, 158 + xOffset, 112 + yOffset);
        const secondLineWords = line2.trim().split(' ');
        if (secondLineWords.length === 1) {
            ctx.fillText(line2, 300 + xOffset, 149 + yOffset);
        } else {
            ctx.fillText(line2, 200 + xOffset, 149 + yOffset);
        }
    }

    // Draw signature
    const signature = params.principal || 'Osama Aziz';
    ctx.font = 'italic 38px AlexBrush';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    const sigX = set === 'set2' ? 955 : 1047;
    const sigY = set === 'set2' ? 700 : 693;
    ctx.fillText(signature, sigX, sigY);

    return canvas;
}


// GEN
app.all('/gen', async (req, res) => {
    try {
        const params = req.method === 'GET' ? req.query : req.body;

        if (!params.name) {
            return res.status(400).json({ error: 'Name parameter is required' });
        }


        const template = params.template || '1';
        const set = template === '2' ? 'set2' : 'set1';


        const canvas = await generateCard(params, set);
        const buffer = canvas.toBuffer('image/png');


// Check rawByte flag
const showRaw = params.rawByte == 1;

if (showRaw) {
    res.setHeader('Content-Type', 'application/json');

    return res.json({
        success: true,
        type: "raw-bytes",
        format: "image/png",
        size: buffer.length,
        data: buffer.toString('base64') // raw bytes encoded for JSON
    });
}

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename="student_id_card.png"');
        res.send(buffer);

    } catch (error) {
        console.error('Error generating card:', error);
        res.status(500).json({ error: 'Failed to generate ID card', message: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health
app.get('/health', (req, res) => {
    res.json({
        message: 'Student ID Card Generator API',
        version: '2.0.0',
        author: 'BotolBaba',
        endpoints: {
            generate: '/gen (GET or POST)',
            handGen: '/handGen (GET or POST)',
            health: '/health',
        },
        generate_parameters: {
            name: 'required - Student name',
            dob: 'optional - Date of birth (default: 01/25/2001)',
            id: 'optional - ID format (1=numeric, 2=alphanumeric, default: 1)',
            academicyear: 'optional - Academic year (default: 2025-2028)',
            opacity: 'optional - Center icon opacity (default: 0.1)',
            country: 'optional - Country index (default: 0). Country selection is optional when you want to use custom college name',
            clgName: 'optional - Custom College Name',
            clgAdd: 'Custom College Address | Required if you want to use Custom College Name',
            principal: 'optional - Principal name (default: Osama Aziz)',
            template: 'optional - Template (1 or 2, default: 1)',
            style: 'optional - Style (1 to 6, default: 2)',
            student_photo: 'optional - Student photo URL',
            college_logo: 'optional - College logo URL',
            issue_date: 'optional - Issue date (default: 15 AUG 2025)',
            issue_txt: 'optional - Issue text (default: Date Of Issue)',
            exp_date: 'optional - Expiry date (default: 31 DEC 2025)',
            exp_txt: 'optional - Expiry text (default: Card Expires)',
            rawByte: '2 (Default) - Normal PNG Image. 1 - Show Raw image byte Data.'
        },
        handGen_parameters: {
            schoolName: 'optional - School name (default: Springfield Prep Charter School)',
            studentName: 'optional - Student name (default: JASON MILLER)',
            studentEmail: 'optional - Student email (default: UN82728191@un.edu)',
            studentDept: 'optional - Department (default: Physical Education Department)',
            validThru: 'optional - Valid thru date (default: DEC 2028)',
            idNumber: 'optional - ID number (auto-generated if not provided)',
            schoolLogo: 'optional - School logo URL or base64',
            studentPhoto: 'optional - Student photo URL or base64',
            rawByte: 'optional - Set to 1 for JSON response with base64 data',
            hand: '2 Style Available - Set 1 or 2'
        }
    });
});



app.get('/barcode', (req, res) => {
  try {
    bwipjs.toBuffer({
      bcid:        'code128',       // Barcode type
      text:        req.query.text || '1234567890', // Text to encode
      scale: 3,
            height: 12,
            includetext: false,
            padding: 10,
            backgroundcolor: 'CDCDCF'
    }, (err, png) => {
      if (err) {
        res.status(500).send('Barcode generation error');
      } else {
        res.type('image/png');
        res.send(png);
      }
    });
  } catch (e) {
    res.status(500).send('Server error');
  }
});


app.listen(PORT, () => {
    console.log(`Student ID Card Generator API running on port ${PORT}`);
});


