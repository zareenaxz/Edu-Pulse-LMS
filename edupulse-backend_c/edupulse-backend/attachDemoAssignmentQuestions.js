// attachDemoAssignmentQuestions.js
// ------------------------------------------------------------
// Automatically creates realistic PDF question files for the
// existing demo assignments and attaches them to the matching
// assignments in the EduPulse database.
//
// IMPORTANT:
// - Does NOT delete existing data.
// - Matches assignments by COURSE TITLE + ASSIGNMENT TITLE.
// - Creates PDFs inside:
//   uploads/demo_assignment_questions/
// ------------------------------------------------------------

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/db');

const OUTPUT_DIR = path.join(
  __dirname,
  'uploads',
  'demo_assignment_questions'
);

// ------------------------------------------------------------
// DEMO ASSIGNMENT QUESTIONS
// ------------------------------------------------------------

const assignments = [
  {
    course: 'HTML & CSS Fundamentals',
    title: 'Build a Responsive Landing Page',
    question: `
Create a responsive landing page for a fictional educational platform.

Requirements:
1. Create a semantic HTML structure using header, nav, main, section and footer.
2. Add a hero section containing a heading, short description and CTA button.
3. Add at least three feature cards.
4. Use CSS Flexbox or Grid for layout.
5. Make the page responsive for desktop, tablet and mobile screens.
6. Use appropriate spacing, typography and visual hierarchy.

Submission:
Submit the HTML and CSS files. Include screenshots of the final page.

Total Marks: 100
    `
  },

  {
    course: 'HTML & CSS Fundamentals',
    title: 'Responsive Design Task',
    question: `
Design a responsive profile webpage for a student.

Requirements:
1. Create a profile section containing name, image, short biography and contact information.
2. Use CSS Grid or Flexbox.
3. Add a navigation bar.
4. Implement responsive behavior using media queries.
5. Ensure the layout works correctly on mobile and desktop.
6. Maintain readable typography and consistent spacing.

Submission:
Submit HTML and CSS files with screenshots.

Total Marks: 100
    `
  },

  {
    course: 'JavaScript Essentials',
    title: 'Interactive DOM Project',
    question: `
Build a small interactive Task Manager using HTML, CSS and JavaScript.

Requirements:
1. Allow users to add tasks.
2. Display tasks dynamically using the DOM.
3. Allow users to mark tasks as completed.
4. Allow users to delete tasks.
5. Display an appropriate message when there are no tasks.
6. Use JavaScript event listeners for user interactions.

Submission:
Submit the complete project files and screenshots.

Total Marks: 100
    `
  },

  {
    course: 'JavaScript Essentials',
    title: 'Fetch API Mini Project',
    question: `
Create a JavaScript application that retrieves data from a public REST API.

Requirements:
1. Use the Fetch API.
2. Display the retrieved data dynamically.
3. Implement loading and error states.
4. Handle unsuccessful API responses.
5. Format the returned data in a user-friendly interface.
6. Use async/await.

Submission:
Submit the JavaScript, HTML and CSS files with screenshots.

Total Marks: 100
    `
  },

  {
    course: 'Python Programming Fundamentals',
    title: 'Python Problem Solving',
    question: `
Solve a set of programming problems using Python.

Tasks:
1. Find the largest and smallest number in a list.
2. Count the frequency of each element.
3. Check whether a string is a palindrome.
4. Calculate factorial using a function.
5. Remove duplicate values from a list.

Requirements:
- Use functions where appropriate.
- Write readable Python code.
- Add comments explaining important sections.
- Test the program with multiple inputs.

Total Marks: 100
    `
  },

  {
    course: 'Python Programming Fundamentals',
    title: 'File Processing Task',
    question: `
Develop a Python program for processing a text file.

Requirements:
1. Read a text file.
2. Count the number of lines.
3. Count the number of words.
4. Count the number of characters.
5. Find the five most frequent words.
6. Save the generated statistics into a separate output file.

Submission:
Submit the Python source code and sample input/output files.

Total Marks: 100
    `
  },

  {
    course: 'Data Structures with Python',
    title: 'Stack and Queue Implementation',
    question: `
Implement Stack and Queue data structures using Python.

Requirements:
1. Implement a Stack using a list.
2. Implement push and pop operations.
3. Implement a Queue.
4. Implement enqueue and dequeue operations.
5. Handle empty Stack and Queue conditions.
6. Demonstrate both structures with sample operations.

Also explain the practical applications of Stack and Queue.

Total Marks: 100
    `
  },

  {
    course: 'Data Structures with Python',
    title: 'Complexity Analysis',
    question: `
Analyze the time and space complexity of common algorithms.

Tasks:
1. Analyze linear search.
2. Analyze binary search.
3. Analyze bubble sort.
4. Analyze merge sort.
5. Compare their best, average and worst cases.

Submission:
Prepare a short report containing Big-O notation and explanations.

Total Marks: 100
    `
  },

  {
    course: 'Database Management System',
    title: 'SQL Query Practice',
    question: `
Write SQL queries for a university database.

Tables:
Students(student_id, name, department, cgpa)
Courses(course_id, course_name, credit)
Enrollments(student_id, course_id, semester, grade)

Tasks:
1. Display all students.
2. Find students with CGPA above 3.50.
3. Display students from the CSE department.
4. Join Students and Enrollments.
5. Count students enrolled in each course.
6. Find the highest CGPA.

Total Marks: 100
    `
  },

  {
    course: 'Database Management System',
    title: 'Database Normalization Task',
    question: `
Consider a university registration table containing:

StudentID, StudentName, Department, CourseID,
CourseName, InstructorID, InstructorName, Grade

Tasks:
1. Identify repeating groups.
2. Convert the relation into First Normal Form.
3. Convert it into Second Normal Form.
4. Convert it into Third Normal Form.
5. Draw the final relational structure.
6. Explain the functional dependencies.

Total Marks: 100
    `
  },

  {
    course: 'Advanced SQL and Query Optimization',
    title: 'Advanced Query Challenge',
    question: `
Write advanced SQL queries for an e-commerce database.

Tasks:
1. Find the top five customers by total spending.
2. Find products that have never been purchased.
3. Calculate monthly sales.
4. Find the average order value.
5. Use a subquery to identify customers above average spending.
6. Use a window function to rank products by sales.

Total Marks: 100
    `
  },

  {
    course: 'Advanced SQL and Query Optimization',
    title: 'Query Optimization Report',
    question: `
Analyze and optimize a slow SQL query.

Tasks:
1. Identify possible performance bottlenecks.
2. Explain how indexes can improve performance.
3. Discuss the difference between clustered and non-clustered indexes.
4. Explain how query execution plans help optimization.
5. Rewrite the provided query in an optimized form.
6. Compare the expected performance before and after optimization.

Total Marks: 100
    `
  },

  {
    course: 'Cybersecurity Fundamentals',
    title: 'Security Threat Analysis',
    question: `
Analyze common cybersecurity threats affecting an organization.

Analyze:
1. Phishing
2. Malware
3. Ransomware
4. SQL Injection
5. Denial-of-Service attacks
6. Insider threats

For each threat, explain:
- Attack mechanism
- Potential impact
- Prevention strategy
- Example scenario

Total Marks: 100
    `
  },

  {
    course: 'Cybersecurity Fundamentals',
    title: 'Security Best Practices Checklist',
    question: `
Prepare a cybersecurity best-practices checklist for a small organization.

Include:
1. Password security
2. Multi-factor authentication
3. Software updates
4. Backup strategy
5. Access control
6. Email security
7. Device security
8. Employee awareness

Explain why each practice is important.

Total Marks: 100
    `
  },

  {
    course: 'Computer Networking Essentials',
    title: 'IP Addressing Exercise',
    question: `
Solve the following IPv4 subnetting problems.

Tasks:
1. Divide 192.168.10.0/24 into four equal subnets.
2. Determine network and broadcast addresses.
3. Calculate the usable host range.
4. Determine the subnet mask.
5. Explain the purpose of subnetting.

Show all calculation steps.

Total Marks: 100
    `
  },

  {
    course: 'Computer Networking Essentials',
    title: 'Network Troubleshooting Case',
    question: `
A small office reports that several computers cannot access the internet.

Analyze the possible causes.

Your report should include:
1. Physical connectivity checks.
2. IP configuration checks.
3. DNS troubleshooting.
4. Gateway verification.
5. Ping and traceroute testing.
6. Possible router or firewall issues.

Provide a step-by-step troubleshooting procedure.

Total Marks: 100
    `
  },

  {
    course: 'Data Science with Python',
    title: 'Data Cleaning Exercise',
    question: `
Use Python and Pandas to clean a dataset containing customer information.

Perform:
1. Missing-value detection.
2. Missing-value treatment.
3. Duplicate removal.
4. Data-type correction.
5. Outlier identification.
6. Column-name standardization.

Submit the cleaned dataset and Python notebook/script.

Total Marks: 100
    `
  },

  {
    course: 'Data Science with Python',
    title: 'Feature Engineering Task',
    question: `
Perform feature engineering on a machine-learning dataset.

Requirements:
1. Identify numerical and categorical features.
2. Apply suitable encoding.
3. Normalize or standardize numerical features.
4. Create at least two derived features.
5. Explain why each transformation was selected.
6. Compare the dataset before and after feature engineering.

Total Marks: 100
    `
  },

  {
    course: 'Machine Learning Fundamentals',
    title: 'Classification Experiment',
    question: `
Build a classification model using a suitable dataset.

Requirements:
1. Perform data preprocessing.
2. Split the dataset into training and testing sets.
3. Train a classification model.
4. Evaluate the model.
5. Display the confusion matrix.
6. Report accuracy, precision, recall and F1-score.

Explain the results.

Total Marks: 100
    `
  },

  {
    course: 'Machine Learning Fundamentals',
    title: 'Model Evaluation Report',
    question: `
Compare at least two machine-learning classification models.

Requirements:
1. Use the same dataset for both models.
2. Apply the same train/test split.
3. Calculate accuracy.
4. Calculate precision, recall and F1-score.
5. Generate confusion matrices.
6. Discuss which model performs better and why.

Total Marks: 100
    `
  },

  {
    course: 'Software Engineering Principles',
    title: 'Requirements Specification',
    question: `
Prepare a Software Requirements Specification for an Online Learning Management System.

Include:
1. System overview.
2. Functional requirements.
3. Non-functional requirements.
4. User roles.
5. Use cases.
6. System constraints.
7. Assumptions.

Clearly distinguish functional and non-functional requirements.

Total Marks: 100
    `
  },

  {
    course: 'Software Engineering Principles',
    title: 'Agile Sprint Plan',
    question: `
Prepare an Agile sprint plan for developing a small LMS.

Include:
1. Product backlog.
2. User stories.
3. Sprint goal.
4. Task breakdown.
5. Priority.
6. Estimated effort.
7. Definition of Done.

Prepare a plan for a two-week sprint.

Total Marks: 100
    `
  },

  {
    course: 'UI/UX Design Fundamentals',
    title: 'Wireframe Task',
    question: `
Design low-fidelity wireframes for a student learning platform.

Create wireframes for:
1. Login page.
2. Student dashboard.
3. Course catalog.
4. Course details page.
5. Lesson player.
6. Assignment submission page.

Explain the navigation flow between screens.

Total Marks: 100
    `
  },

  {
    course: 'UI/UX Design Fundamentals',
    title: 'Usability Evaluation',
    question: `
Evaluate the usability of an existing educational website or application.

Evaluate:
1. Navigation.
2. Learnability.
3. Consistency.
4. Accessibility.
5. Feedback.
6. Error prevention.
7. Visual hierarchy.

Identify at least five usability problems and provide improvements.

Total Marks: 100
    `
  }
];

// ------------------------------------------------------------
// PDF GENERATOR
// ------------------------------------------------------------

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '');
}

function wrapText(text, maxChars = 92) {
  const lines = [];

  for (const rawLine of String(text).split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      lines.push('');
      continue;
    }

    const words = line.split(/\s+/);
    let current = '';

    for (const word of words) {
      if ((current + ' ' + word).trim().length <= maxChars) {
        current = (current + ' ' + word).trim();
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

function createPdf(title, question, outputPath) {
  const lines = wrapText(question);

  const pageWidth = 595;
  const pageHeight = 842;

  const marginLeft = 50;
  const marginTop = 60;
  const lineHeight = 15;

  const pages = [];
  let currentPage = [];
  let y = pageHeight - marginTop;

  currentPage.push({
    type: 'title',
    text: title
  });

  y -= 45;

  for (const line of lines) {
    if (y < 60) {
      pages.push(currentPage);
      currentPage = [];
      y = pageHeight - marginTop;
    }

    currentPage.push({
      type: 'line',
      text: line,
      y
    });

    y -= lineHeight;
  }

  pages.push(currentPage);

  const objects = [];

  objects.push(
    '<< /Type /Catalog /Pages 2 0 R >>'
  );

  objects.push(
    `<< /Type /Pages /Kids [${pages
      .map((_, index) => `${3 + index * 2} 0 R`)
      .join(' ')}] /Count ${pages.length} >>`
  );

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = 3 + i * 2;
    const contentNumber = 4 + i * 2;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 1 0 R >> >> /Contents ${contentNumber} 0 R >>`
    );

    let stream = '';

    stream += 'BT\n';
    stream += '/F1 18 Tf\n';
    stream += `${marginLeft} ${pageHeight - 60} Td\n`;

    if (i === 0) {
      stream += `(${escapePdfText(title)}) Tj\n`;
    } else {
      stream += `(${escapePdfText(title)} - Page ${i + 1}) Tj\n`;
    }

    stream += '/F1 10 Tf\n';
    stream += `0 -35 Td\n`;

    for (const item of pages[i]) {
      if (item.type === 'line') {
        stream += `(${escapePdfText(item.text)}) Tj\n`;
        stream += `0 -${lineHeight} Td\n`;
      }
    }

    stream += 'ET\n';

    objects.push(
      `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream`
    );
  }

  objects[0] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets[i + 1] = Buffer.byteLength(pdf, 'utf8');

    pdf += `${i + 1} 0 obj\n`;
    pdf += `${objects[i]}\n`;
    pdf += 'endobj\n';
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n`;
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n`;
  pdf += '%%EOF';

  fs.writeFileSync(outputPath, pdf);
}

// ------------------------------------------------------------
// SAFE FILE NAME
// ------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

async function main() {
  try {
    console.log('');
    console.log('==============================================');
    console.log(' EduPulse Demo Assignment Attachment Tool');
    console.log('==============================================');
    console.log('');

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Find all existing assignments together with their courses.
    const [rows] = await pool.execute(`
      SELECT
        a.assignment_id,
        a.title AS assignment_title,
        a.attachment_url,
        c.title AS course_title
      FROM assignments a
      INNER JOIN courses c
        ON c.course_id = a.course_id
      ORDER BY c.title, a.assignment_id
    `);

    console.log(`Found ${rows.length} assignments in database.`);
    console.log('');

    let attached = 0;
    let notFound = 0;
    let skipped = 0;

    for (const item of assignments) {
      const match = rows.find(row =>
        String(row.course_title).trim().toLowerCase() ===
          String(item.course).trim().toLowerCase() &&
        String(row.assignment_title).trim().toLowerCase() ===
          String(item.title).trim().toLowerCase()
      );

      if (!match) {
        console.log(
          `[NOT FOUND] ${item.course} -> ${item.title}`
        );

        notFound++;
        continue;
      }

      const fileName =
        `${slugify(item.course)}__${slugify(item.title)}.pdf`;

      const absolutePath = path.join(
        OUTPUT_DIR,
        fileName
      );

      const attachmentUrl =
        `/uploads/demo_assignment_questions/${fileName}`;

      // Create the question PDF.
      createPdf(
        item.title,
        item.question,
        absolutePath
      );

      const stats = fs.statSync(absolutePath);

      // Update only attachment-related fields.
      await pool.execute(
        `
        UPDATE assignments
        SET
          attachment_url = :attachmentUrl,
          attachment_name = :attachmentName,
          attachment_mime_type = 'application/pdf',
          attachment_size = :attachmentSize
        WHERE assignment_id = :assignmentId
        `,
        {
          attachmentUrl,
          attachmentName: fileName,
          attachmentSize: stats.size,
          assignmentId: match.assignment_id
        }
      );

      console.log(
        `[ATTACHED] ${item.course} -> ${item.title}`
      );

      console.log(
        `           ${attachmentUrl}`
      );

      attached++;
    }

    console.log('');
    console.log('==============================================');
    console.log(' Finished');
    console.log('==============================================');
    console.log(`Attached : ${attached}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Skipped  : ${skipped}`);
    console.log('');
    console.log(
      `PDF folder: ${OUTPUT_DIR}`
    );
    console.log('');

  } catch (error) {
    console.error('');
    console.error('ERROR:');
    console.error(error);
    console.error('');
  } finally {
    await pool.end();
  }
}

main();