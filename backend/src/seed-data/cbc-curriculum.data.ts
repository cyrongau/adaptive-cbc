export interface SeedSubject {
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  applicableGrades: number[];
  strands: SeedStrand[];
}

export interface SeedStrand {
  name: string;
  code: string;
  description: string;
  applicableGrades: number[];
  sortOrder: number;
  subStrands: SeedSubStrand[];
}

export interface SeedSubStrand {
  name: string;
  code: string;
  description: string;
  applicableGrades: number[];
  sortOrder: number;
  learningOutcomes: SeedLearningOutcome[];
}

export interface SeedLearningOutcome {
  description: string;
  code: string;
  grade: number;
  competencies: string[];
  sortOrder: number;
}

export const CBC_COMPETENCIES = [
  { name: 'Communication and Collaboration', code: 'CC', category: 'cbc_core', description: 'Ability to express oneself clearly and work with others' },
  { name: 'Critical Thinking and Problem Solving', code: 'CTPS', category: 'cbc_core', description: 'Ability to analyze situations and find solutions' },
  { name: 'Creativity and Imagination', code: 'CI', category: 'cbc_core', description: 'Ability to generate new ideas and think innovatively' },
  { name: 'Citizenship', code: 'CIT', category: 'cbc_core', description: 'Understanding of rights, responsibilities and national values' },
  { name: 'Digital Literacy', code: 'DL', category: 'cbc_core', description: 'Ability to use digital technology effectively' },
  { name: 'Learning to Learn', code: 'LL', category: 'cbc_core', description: 'Ability to reflect on and regulate one\'s own learning' },
  { name: 'Self-Efficacy', code: 'SE', category: 'cbc_core', description: 'Belief in one\'s ability to accomplish tasks' },
  { name: 'Mathematical Competency', code: 'MC', category: 'subject_specific', description: 'Application of mathematical concepts and skills' },
  { name: 'Scientific Inquiry', code: 'SCI', category: 'subject_specific', description: 'Use of scientific methods to explore phenomena' },
  { name: 'Technological Competency', code: 'TEC', category: 'subject_specific', description: 'Application of technology in problem-solving' },
  { name: 'Linguistic Competency', code: 'LIN', category: 'subject_specific', description: 'Proficiency in language use and comprehension' },
  { name: 'Environmental Awareness', code: 'ENV', category: 'subject_specific', description: 'Understanding of environmental issues and conservation' },
  { name: 'Artistic Expression', code: 'ART', category: 'subject_specific', description: 'Ability to express through various art forms' },
  { name: 'Psychomotor Competency', code: 'PSY', category: 'subject_specific', description: 'Physical coordination and motor skills' },
  { name: 'Spiritual Competency', code: 'SPI', category: 'subject_specific', description: 'Understanding of spiritual and moral values' },
  { name: 'Entrepreneurial Competency', code: 'ENT', category: 'subject_specific', description: 'Ability to identify and pursue business opportunities' },
];

const ppMathStrands: SeedStrand[] = [
  {
    name: 'Number Concepts', code: 'PP-MATH-NC', description: 'Basic number recognition and counting',
    applicableGrades: [1, 2], sortOrder: 1, subStrands: [
      {
        name: 'Number Recognition', code: 'PP-MATH-NR', description: 'Identifying and naming numbers',
        applicableGrades: [1, 2], sortOrder: 1, learningOutcomes: [
          { description: 'Identify numbers 1-5 in the environment', code: 'PP-MATH-NR-01', grade: 1, competencies: ['CC'], sortOrder: 1 },
          { description: 'Count objects 1-5 using one-to-one correspondence', code: 'PP-MATH-NR-02', grade: 1, competencies: ['MC'], sortOrder: 2 },
          { description: 'Trace and write numbers 1-5', code: 'PP-MATH-NR-03', grade: 1, competencies: ['PSY'], sortOrder: 3 },
          { description: 'Identify numbers 6-10 in the environment', code: 'PP-MATH-NR-04', grade: 2, competencies: ['CC'], sortOrder: 4 },
          { description: 'Count objects 6-10 using one-to-one correspondence', code: 'PP-MATH-NR-05', grade: 2, competencies: ['MC'], sortOrder: 5 },
          { description: 'Trace and write numbers 6-10', code: 'PP-MATH-NR-06', grade: 2, competencies: ['PSY'], sortOrder: 6 },
        ]
      },
      {
        name: 'Counting and Quantity', code: 'PP-MATH-CQ', description: 'Understanding quantity through counting',
        applicableGrades: [1, 2], sortOrder: 2, learningOutcomes: [
          { description: 'Count forward from 1-5', code: 'PP-MATH-CQ-01', grade: 1, competencies: ['MC'], sortOrder: 1 },
          { description: 'Match quantity to numeral 1-5', code: 'PP-MATH-CQ-02', grade: 1, competencies: ['MC', 'CC'], sortOrder: 2 },
          { description: 'Count forward from 1-10', code: 'PP-MATH-CQ-03', grade: 2, competencies: ['MC'], sortOrder: 3 },
          { description: 'Match quantity to numeral 6-10', code: 'PP-MATH-CQ-04', grade: 2, competencies: ['MC', 'CC'], sortOrder: 4 },
        ]
      },
    ]
  },
  {
    name: 'Measurement', code: 'PP-MATH-ME', description: 'Basic measurement concepts',
    applicableGrades: [1, 2], sortOrder: 2, subStrands: [
      {
        name: 'Length', code: 'PP-MATH-LEN', description: 'Comparing lengths',
        applicableGrades: [1, 2], sortOrder: 1, learningOutcomes: [
          { description: 'Compare objects as long/short', code: 'PP-MATH-LEN-01', grade: 1, competencies: ['MC'], sortOrder: 1 },
          { description: 'Order objects by length', code: 'PP-MATH-LEN-02', grade: 2, competencies: ['MC', 'CTPS'], sortOrder: 2 },
        ]
      },
      {
        name: 'Mass', code: 'PP-MATH-MAS', description: 'Comparing mass',
        applicableGrades: [1, 2], sortOrder: 2, learningOutcomes: [
          { description: 'Compare objects as heavy/light', code: 'PP-MATH-MAS-01', grade: 1, competencies: ['MC'], sortOrder: 1 },
          { description: 'Order objects by mass', code: 'PP-MATH-MAS-02', grade: 2, competencies: ['MC', 'CTPS'], sortOrder: 2 },
        ]
      },
    ]
  },
  {
    name: 'Geometry', code: 'PP-MATH-GEO', description: 'Basic shapes and spatial awareness',
    applicableGrades: [1, 2], sortOrder: 3, subStrands: [
      {
        name: 'Shapes', code: 'PP-MATH-SHP', description: 'Identifying basic shapes',
        applicableGrades: [1, 2], sortOrder: 1, learningOutcomes: [
          { description: 'Identify circles and squares', code: 'PP-MATH-SHP-01', grade: 1, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Identify triangles and rectangles', code: 'PP-MATH-SHP-02', grade: 2, competencies: ['MC', 'CC'], sortOrder: 2 },
          { description: 'Classify objects by shape', code: 'PP-MATH-SHP-03', grade: 2, competencies: ['MC', 'CTPS'], sortOrder: 3 },
        ]
      },
    ]
  },
];

const lowerPrimaryMathStrands: SeedStrand[] = [
  {
    name: 'Numbers', code: 'LP-MATH-NUM', description: 'Operations with numbers',
    applicableGrades: [3, 4, 5], sortOrder: 1, subStrands: [
      {
        name: 'Whole Numbers', code: 'LP-MATH-WHN', description: 'Understanding whole numbers up to 1000',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Count and write numbers up to 100', code: 'LP-MATH-WHN-01', grade: 3, competencies: ['MC'], sortOrder: 1 },
          { description: 'Identify place value of digits up to hundreds', code: 'LP-MATH-WHN-02', grade: 3, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Compare and order numbers up to 1000', code: 'LP-MATH-WHN-03', grade: 4, competencies: ['MC'], sortOrder: 3 },
          { description: 'Round numbers to nearest ten and hundred', code: 'LP-MATH-WHN-04', grade: 5, competencies: ['MC', 'CTPS'], sortOrder: 4 },
        ]
      },
      {
        name: 'Addition and Subtraction', code: 'LP-MATH-ADS', description: 'Adding and subtracting whole numbers',
        applicableGrades: [3, 4, 5], sortOrder: 2, learningOutcomes: [
          { description: 'Add numbers up to 100 without regrouping', code: 'LP-MATH-ADS-01', grade: 3, competencies: ['MC'], sortOrder: 1 },
          { description: 'Subtract numbers up to 100 without regrouping', code: 'LP-MATH-ADS-02', grade: 3, competencies: ['MC'], sortOrder: 2 },
          { description: 'Add numbers up to 1000 with regrouping', code: 'LP-MATH-ADS-03', grade: 4, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Subtract numbers up to 1000 with regrouping', code: 'LP-MATH-ADS-04', grade: 4, competencies: ['MC', 'CTPS'], sortOrder: 4 },
          { description: 'Solve word problems involving addition and subtraction', code: 'LP-MATH-ADS-05', grade: 5, competencies: ['MC', 'CTPS', 'CC'], sortOrder: 5 },
        ]
      },
      {
        name: 'Multiplication and Division', code: 'LP-MATH-MUD', description: 'Basic multiplication and division',
        applicableGrades: [4, 5], sortOrder: 3, learningOutcomes: [
          { description: 'Multiply 2-digit by 1-digit numbers', code: 'LP-MATH-MUD-01', grade: 4, competencies: ['MC'], sortOrder: 1 },
          { description: 'Divide 2-digit numbers by 1-digit numbers', code: 'LP-MATH-MUD-02', grade: 4, competencies: ['MC'], sortOrder: 2 },
          { description: 'Recall multiplication tables up to 12x12', code: 'LP-MATH-MUD-03', grade: 5, competencies: ['MC', 'LL'], sortOrder: 3 },
          { description: 'Solve problems involving multiplication and division', code: 'LP-MATH-MUD-04', grade: 5, competencies: ['MC', 'CTPS'], sortOrder: 4 },
        ]
      },
    ]
  },
  {
    name: 'Fractions', code: 'LP-MATH-FRC', description: 'Understanding fractions',
    applicableGrades: [4, 5], sortOrder: 2, subStrands: [
      {
        name: 'Basic Fractions', code: 'LP-MATH-BFR', description: 'Identifying and working with fractions',
        applicableGrades: [4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Identify halves, thirds and quarters', code: 'LP-MATH-BFR-01', grade: 4, competencies: ['MC'], sortOrder: 1 },
          { description: 'Write fractions from pictorial representations', code: 'LP-MATH-BFR-02', grade: 4, competencies: ['MC', 'CC'], sortOrder: 2 },
          { description: 'Compare and order fractions with same denominator', code: 'LP-MATH-BFR-03', grade: 5, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Add and subtract fractions with same denominator', code: 'LP-MATH-BFR-04', grade: 5, competencies: ['MC'], sortOrder: 4 },
        ]
      },
    ]
  },
  {
    name: 'Measurement', code: 'LP-MATH-MEA', description: 'Measurement concepts',
    applicableGrades: [3, 4, 5], sortOrder: 3, subStrands: [
      {
        name: 'Length, Mass and Capacity', code: 'LP-MATH-LMC', description: 'Standard units of measurement',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Measure length using non-standard units', code: 'LP-MATH-LMC-01', grade: 3, competencies: ['MC', 'PSY'], sortOrder: 1 },
          { description: 'Measure length in metres and centimetres', code: 'LP-MATH-LMC-02', grade: 4, competencies: ['MC'], sortOrder: 2 },
          { description: 'Measure mass in kilograms', code: 'LP-MATH-LMC-03', grade: 4, competencies: ['MC'], sortOrder: 3 },
          { description: 'Measure capacity in litres', code: 'LP-MATH-LMC-04', grade: 5, competencies: ['MC'], sortOrder: 4 },
          { description: 'Convert between units of length', code: 'LP-MATH-LMC-05', grade: 5, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
      {
        name: 'Time', code: 'LP-MATH-TIM', description: 'Telling time',
        applicableGrades: [3, 4, 5], sortOrder: 2, learningOutcomes: [
          { description: 'Tell time to the hour and half-hour', code: 'LP-MATH-TIM-01', grade: 3, competencies: ['MC'], sortOrder: 1 },
          { description: 'Tell time to the quarter-hour', code: 'LP-MATH-TIM-02', grade: 4, competencies: ['MC'], sortOrder: 2 },
          { description: 'Tell time to the nearest 5 minutes', code: 'LP-MATH-TIM-03', grade: 5, competencies: ['MC'], sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: 'Geometry', code: 'LP-MATH-GEO', description: 'Shapes and space',
    applicableGrades: [3, 4, 5], sortOrder: 4, subStrands: [
      {
        name: '2D and 3D Shapes', code: 'LP-MATH-SHP', description: 'Identifying and describing shapes',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Identify 2D shapes (circle, square, triangle, rectangle)', code: 'LP-MATH-SHP-01', grade: 3, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Identify 3D objects (cube, cuboid, sphere, cylinder)', code: 'LP-MATH-SHP-02', grade: 4, competencies: ['MC', 'CC'], sortOrder: 2 },
          { description: 'Draw and describe 2D shapes', code: 'LP-MATH-SHP-03', grade: 5, competencies: ['MC', 'CI'], sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: 'Data Handling', code: 'LP-MATH-DAT', description: 'Collecting and representing data',
    applicableGrades: [4, 5], sortOrder: 5, subStrands: [
      {
        name: 'Pictograms and Bar Graphs', code: 'LP-MATH-PBG', description: 'Representing data visually',
        applicableGrades: [4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Collect and classify objects', code: 'LP-MATH-PBG-01', grade: 4, competencies: ['MC', 'CTPS'], sortOrder: 1 },
          { description: 'Draw and interpret pictograms', code: 'LP-MATH-PBG-02', grade: 4, competencies: ['MC', 'CI'], sortOrder: 2 },
          { description: 'Draw and interpret bar graphs', code: 'LP-MATH-PBG-03', grade: 5, competencies: ['MC', 'CI', 'CTPS'], sortOrder: 3 },
        ]
      },
    ]
  },
];

const upperPrimaryMathStrands: SeedStrand[] = [
  {
    name: 'Numbers and Operations', code: 'UP-MATH-NOP', description: 'Advanced number operations',
    applicableGrades: [6, 7, 8], sortOrder: 1, subStrands: [
      {
        name: 'Whole Numbers and Decimals', code: 'UP-MATH-WND', description: 'Operations with whole numbers and decimals',
        applicableGrades: [6, 7, 8], sortOrder: 1, learningOutcomes: [
          { description: 'Read and write numbers up to millions', code: 'UP-MATH-WND-01', grade: 6, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Add and subtract decimals', code: 'UP-MATH-WND-02', grade: 6, competencies: ['MC'], sortOrder: 2 },
          { description: 'Multiply and divide decimals', code: 'UP-MATH-WND-03', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Apply order of operations (BODMAS)', code: 'UP-MATH-WND-04', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 4 },
          { description: 'Solve multi-step problems involving whole numbers and decimals', code: 'UP-MATH-WND-05', grade: 8, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
      {
        name: 'Fractions and Percentages', code: 'UP-MATH-FAP', description: 'Advanced fraction and percentage concepts',
        applicableGrades: [6, 7, 8], sortOrder: 2, learningOutcomes: [
          { description: 'Convert between fractions, decimals and percentages', code: 'UP-MATH-FAP-01', grade: 6, competencies: ['MC', 'LL'], sortOrder: 1 },
          { description: 'Add and subtract fractions with different denominators', code: 'UP-MATH-FAP-02', grade: 6, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Calculate percentages of quantities', code: 'UP-MATH-FAP-03', grade: 7, competencies: ['MC'], sortOrder: 3 },
          { description: 'Solve problems involving percentage increase and decrease', code: 'UP-MATH-FAP-04', grade: 8, competencies: ['MC', 'CTPS', 'ENT'], sortOrder: 4 },
        ]
      },
      {
        name: 'Ratios and Proportions', code: 'UP-MATH-RAP', description: 'Understanding ratios and proportions',
        applicableGrades: [7, 8], sortOrder: 3, learningOutcomes: [
          { description: 'Express ratios in simplest form', code: 'UP-MATH-RAP-01', grade: 7, competencies: ['MC'], sortOrder: 1 },
          { description: 'Solve problems involving direct proportion', code: 'UP-MATH-RAP-02', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Apply ratios to real-life situations', code: 'UP-MATH-RAP-03', grade: 8, competencies: ['MC', 'ENT'], sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: 'Algebra', code: 'UP-MATH-ALG', description: 'Algebraic concepts',
    applicableGrades: [7, 8], sortOrder: 2, subStrands: [
      {
        name: 'Algebraic Expressions', code: 'UP-MATH-AEX', description: 'Working with algebraic expressions',
        applicableGrades: [7, 8], sortOrder: 1, learningOutcomes: [
          { description: 'Use letters to represent unknown numbers', code: 'UP-MATH-AEX-01', grade: 7, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Simplify algebraic expressions', code: 'UP-MATH-AEX-02', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Solve simple linear equations', code: 'UP-MATH-AEX-03', grade: 8, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Form and solve equations from word problems', code: 'UP-MATH-AEX-04', grade: 8, competencies: ['MC', 'CTPS', 'CC'], sortOrder: 4 },
        ]
      },
    ]
  },
  {
    name: 'Measurement', code: 'UP-MATH-MEA', description: 'Advanced measurement',
    applicableGrades: [6, 7, 8], sortOrder: 3, subStrands: [
      {
        name: 'Perimeter, Area and Volume', code: 'UP-MATH-PAV', description: 'Calculating perimeter, area and volume',
        applicableGrades: [6, 7, 8], sortOrder: 1, learningOutcomes: [
          { description: 'Calculate perimeter of 2D shapes', code: 'UP-MATH-PAV-01', grade: 6, competencies: ['MC'], sortOrder: 1 },
          { description: 'Calculate area of rectangles and squares', code: 'UP-MATH-PAV-02', grade: 6, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Calculate area of triangles', code: 'UP-MATH-PAV-03', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Calculate volume of cuboids', code: 'UP-MATH-PAV-04', grade: 7, competencies: ['MC'], sortOrder: 4 },
          { description: 'Calculate area of circles', code: 'UP-MATH-PAV-05', grade: 8, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
    ]
  },
  {
    name: 'Geometry', code: 'UP-MATH-GEO', description: 'Advanced geometry',
    applicableGrades: [6, 7, 8], sortOrder: 4, subStrands: [
      {
        name: 'Angles and Lines', code: 'UP-MATH-ANL', description: 'Properties of angles and lines',
        applicableGrades: [6, 7, 8], sortOrder: 1, learningOutcomes: [
          { description: 'Identify and name types of angles', code: 'UP-MATH-ANL-01', grade: 6, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Measure angles using a protractor', code: 'UP-MATH-ANL-02', grade: 6, competencies: ['MC', 'PSY'], sortOrder: 2 },
          { description: 'Identify properties of parallel and perpendicular lines', code: 'UP-MATH-ANL-03', grade: 7, competencies: ['MC', 'CC'], sortOrder: 3 },
          { description: 'Calculate angles on a straight line and around a point', code: 'UP-MATH-ANL-04', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 4 },
          { description: 'Apply angle properties of polygons', code: 'UP-MATH-ANL-05', grade: 8, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
    ]
  },
  {
    name: 'Data Handling and Probability', code: 'UP-MATH-DHP', description: 'Statistics and probability',
    applicableGrades: [7, 8], sortOrder: 5, subStrands: [
      {
        name: 'Data Presentation', code: 'UP-MATH-DPR', description: 'Advanced data representation',
        applicableGrades: [7, 8], sortOrder: 1, learningOutcomes: [
          { description: 'Calculate mean, median and mode', code: 'UP-MATH-DPR-01', grade: 7, competencies: ['MC', 'CTPS'], sortOrder: 1 },
          { description: 'Draw and interpret line graphs', code: 'UP-MATH-DPR-02', grade: 7, competencies: ['MC', 'CI'], sortOrder: 2 },
          { description: 'Calculate range of a data set', code: 'UP-MATH-DPR-03', grade: 8, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Determine probability of simple events', code: 'UP-MATH-DPR-04', grade: 8, competencies: ['MC', 'CTPS', 'LL'], sortOrder: 4 },
        ]
      },
    ]
  },
];

const juniorSecondaryMathStrands: SeedStrand[] = [
  {
    name: 'Number Systems', code: 'JS-MATH-NSY', description: 'Advanced number systems and operations',
    applicableGrades: [9, 10, 11], sortOrder: 1, subStrands: [
      {
        name: 'Integers and Rational Numbers', code: 'JS-MATH-IRN', description: 'Working with integers and rational numbers',
        applicableGrades: [9, 10, 11], sortOrder: 1, learningOutcomes: [
          { description: 'Perform operations with integers', code: 'JS-MATH-IRN-01', grade: 9, competencies: ['MC'], sortOrder: 1 },
          { description: 'Work with rational numbers in various forms', code: 'JS-MATH-IRN-02', grade: 9, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Identify and use square roots and cube roots', code: 'JS-MATH-IRN-03', grade: 10, competencies: ['MC'], sortOrder: 3 },
          { description: 'Apply laws of exponents', code: 'JS-MATH-IRN-04', grade: 10, competencies: ['MC', 'CTPS'], sortOrder: 4 },
          { description: 'Perform operations in standard form (scientific notation)', code: 'JS-MATH-IRN-05', grade: 11, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
    ]
  },
  {
    name: 'Algebra and Equations', code: 'JS-MATH-ALG', description: 'Advanced algebra',
    applicableGrades: [9, 10, 11], sortOrder: 2, subStrands: [
      {
        name: 'Linear and Quadratic Equations', code: 'JS-MATH-LQE', description: 'Solving various types of equations',
        applicableGrades: [9, 10, 11], sortOrder: 1, learningOutcomes: [
          { description: 'Solve linear equations in one variable', code: 'JS-MATH-LQE-01', grade: 9, competencies: ['MC'], sortOrder: 1 },
          { description: 'Solve simultaneous linear equations', code: 'JS-MATH-LQE-02', grade: 9, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Factorise algebraic expressions', code: 'JS-MATH-LQE-03', grade: 10, competencies: ['MC', 'CTPS'], sortOrder: 3 },
          { description: 'Solve quadratic equations by factorisation', code: 'JS-MATH-LQE-04', grade: 10, competencies: ['MC', 'CTPS'], sortOrder: 4 },
          { description: 'Solve quadratic equations using the quadratic formula', code: 'JS-MATH-LQE-05', grade: 11, competencies: ['MC', 'CTPS'], sortOrder: 5 },
        ]
      },
    ]
  },
  {
    name: 'Geometry and Trigonometry', code: 'JS-MATH-GTR', description: 'Advanced geometry and trigonometry',
    applicableGrades: [9, 10, 11], sortOrder: 3, subStrands: [
      {
        name: 'Trigonometry', code: 'JS-MATH-TRG', description: 'Trigonometric ratios and applications',
        applicableGrades: [10, 11], sortOrder: 1, learningOutcomes: [
          { description: 'Define sine, cosine and tangent ratios', code: 'JS-MATH-TRG-01', grade: 10, competencies: ['MC', 'CC'], sortOrder: 1 },
          { description: 'Calculate unknown sides using trigonometric ratios', code: 'JS-MATH-TRG-02', grade: 10, competencies: ['MC', 'CTPS'], sortOrder: 2 },
          { description: 'Apply trigonometry to real-life problems', code: 'JS-MATH-TRG-03', grade: 11, competencies: ['MC', 'CTPS', 'ENT'], sortOrder: 3 },
        ]
      },
    ]
  },
];

const engStrands: SeedStrand[] = [
  {
    name: 'Listening and Speaking', code: 'ENG-LIS', description: 'Oral communication skills',
    applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 1, subStrands: [
      {
        name: 'Pronunciation and Fluency', code: 'ENG-PRF', description: 'Developing clear pronunciation and fluency',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Pronounce English sounds correctly', code: 'ENG-PRF-01', grade: 3, competencies: ['LIN', 'CC'], sortOrder: 1 },
          { description: 'Read aloud with appropriate pace and expression', code: 'ENG-PRF-02', grade: 4, competencies: ['LIN', 'CC'], sortOrder: 2 },
          { description: 'Use appropriate intonation in sentences', code: 'ENG-PRF-03', grade: 5, competencies: ['LIN', 'CC'], sortOrder: 3 },
        ]
      },
      {
        name: 'Oral Narratives', code: 'ENG-ORN', description: 'Engaging with oral narratives',
        applicableGrades: [6, 7, 8], sortOrder: 2, learningOutcomes: [
          { description: 'Retell simple stories accurately', code: 'ENG-ORN-01', grade: 6, competencies: ['LIN', 'CC'], sortOrder: 1 },
          { description: 'Identify main ideas in oral narratives', code: 'ENG-ORN-02', grade: 7, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
          { description: 'Present oral narratives with expression', code: 'ENG-ORN-03', grade: 8, competencies: ['LIN', 'CC', 'CI'], sortOrder: 3 },
        ]
      },
    ]
  },
  {
    name: 'Reading', code: 'ENG-REA', description: 'Reading comprehension and analysis',
    applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 2, subStrands: [
      {
        name: 'Word Recognition and Vocabulary', code: 'ENG-WRV', description: 'Building reading vocabulary',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Recognise common sight words', code: 'ENG-WRV-01', grade: 3, competencies: ['LIN', 'LL'], sortOrder: 1 },
          { description: 'Use context to determine word meanings', code: 'ENG-WRV-02', grade: 4, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
          { description: 'Use dictionary to find word meanings', code: 'ENG-WRV-03', grade: 5, competencies: ['LIN', 'LL'], sortOrder: 3 },
        ]
      },
      {
        name: 'Comprehension', code: 'ENG-COM', description: 'Understanding written texts',
        applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 2, learningOutcomes: [
          { description: 'Answer literal questions about a text', code: 'ENG-COM-01', grade: 3, competencies: ['LIN', 'CC'], sortOrder: 1 },
          { description: 'Identify main idea and supporting details', code: 'ENG-COM-02', grade: 4, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
          { description: 'Make predictions based on text clues', code: 'ENG-COM-03', grade: 5, competencies: ['LIN', 'CTPS'], sortOrder: 3 },
          { description: 'Draw conclusions from a text', code: 'ENG-COM-04', grade: 6, competencies: ['LIN', 'CTPS'], sortOrder: 4 },
          { description: 'Analyse characters and plot in fiction', code: 'ENG-COM-05', grade: 7, competencies: ['LIN', 'CTPS', 'CI'], sortOrder: 5 },
          { description: 'Evaluate author\'s purpose and perspective', code: 'ENG-COM-06', grade: 8, competencies: ['LIN', 'CTPS', 'CIT'], sortOrder: 6 },
        ]
      },
    ]
  },
  {
    name: 'Writing', code: 'ENG-WRI', description: 'Writing skills development',
    applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 3, subStrands: [
      {
        name: 'Handwriting and Spelling', code: 'ENG-HSP', description: 'Developing legible handwriting and correct spelling',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Write letters and words legibly', code: 'ENG-HSP-01', grade: 3, competencies: ['LIN', 'PSY'], sortOrder: 1 },
          { description: 'Spell common words correctly', code: 'ENG-HSP-02', grade: 3, competencies: ['LIN', 'LL'], sortOrder: 2 },
          { description: 'Use capital letters and punctuation correctly', code: 'ENG-HSP-03', grade: 4, competencies: ['LIN'], sortOrder: 3 },
        ]
      },
      {
        name: 'Composition Writing', code: 'ENG-CWR', description: 'Writing paragraphs and compositions',
        applicableGrades: [4, 5, 6, 7, 8], sortOrder: 2, learningOutcomes: [
          { description: 'Write simple sentences about familiar topics', code: 'ENG-CWR-01', grade: 4, competencies: ['LIN', 'CI'], sortOrder: 1 },
          { description: 'Write a coherent paragraph with a topic sentence', code: 'ENG-CWR-02', grade: 5, competencies: ['LIN', 'CI', 'CTPS'], sortOrder: 2 },
          { description: 'Write narrative compositions', code: 'ENG-CWR-03', grade: 6, competencies: ['LIN', 'CI'], sortOrder: 3 },
          { description: 'Write descriptive compositions', code: 'ENG-CWR-04', grade: 7, competencies: ['LIN', 'CI', 'CC'], sortOrder: 4 },
          { description: 'Write argumentative essays with supporting evidence', code: 'ENG-CWR-05', grade: 8, competencies: ['LIN', 'CTPS', 'CIT'], sortOrder: 5 },
        ]
      },
    ]
  },
  {
    name: 'Grammar', code: 'ENG-GRA', description: 'English grammar and structure',
    applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 4, subStrands: [
      {
        name: 'Parts of Speech', code: 'ENG-POS', description: 'Identifying and using parts of speech',
        applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
          { description: 'Identify nouns, verbs and adjectives', code: 'ENG-POS-01', grade: 3, competencies: ['LIN'], sortOrder: 1 },
          { description: 'Use pronouns and prepositions correctly', code: 'ENG-POS-02', grade: 4, competencies: ['LIN'], sortOrder: 2 },
          { description: 'Use adverbs and conjunctions correctly', code: 'ENG-POS-03', grade: 5, competencies: ['LIN'], sortOrder: 3 },
        ]
      },
      {
        name: 'Sentence Structure', code: 'ENG-SST', description: 'Constructing correct sentences',
        applicableGrades: [5, 6, 7, 8], sortOrder: 2, learningOutcomes: [
          { description: 'Identify subjects and predicates', code: 'ENG-SST-01', grade: 5, competencies: ['LIN', 'CTPS'], sortOrder: 1 },
          { description: 'Form simple, compound and complex sentences', code: 'ENG-SST-02', grade: 6, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
          { description: 'Use correct tense and subject-verb agreement', code: 'ENG-SST-03', grade: 7, competencies: ['LIN'], sortOrder: 3 },
          { description: 'Transform sentences between active and passive voice', code: 'ENG-SST-04', grade: 8, competencies: ['LIN', 'CTPS'], sortOrder: 4 },
        ]
      },
    ]
  },
];

export const CBC_SUBJECTS: (SeedSubject & { gradeRange: [number, number] })[] = [
  {
    name: 'Mathematics', code: 'MATH', description: 'Development of numerical and mathematical reasoning skills',
    icon: 'calculator', color: '#2563EB', applicableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], gradeRange: [1, 12],
    strands: [...lowerPrimaryMathStrands, ...upperPrimaryMathStrands, ...juniorSecondaryMathStrands],
  },
  {
    name: 'English', code: 'ENG', description: 'English language and literacy skills',
    icon: 'book-open', color: '#059669', applicableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], gradeRange: [1, 12],
    strands: engStrands,
  },
  {
    name: 'Kiswahili', code: 'KISW', description: 'Kiswahili language and literacy skills',
    icon: 'book-open', color: '#D97706', applicableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], gradeRange: [1, 12],
    strands: [
      {
        name: 'Kusikiliza na Kuzungumza', code: 'KISW-LIS', description: 'Listening and speaking skills',
        applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 1, subStrands: [
          {
            name: 'Matamshi na Imla', code: 'KISW-MAI', description: 'Pronunciation and dictation',
            applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
              { description: 'Tamka sauti za Kiswahili kwa usahihi', code: 'KISW-MAI-01', grade: 3, competencies: ['LIN', 'CC'], sortOrder: 1 },
              { description: 'Soma maneno kwa matamshi sahihi', code: 'KISW-MAI-02', grade: 4, competencies: ['LIN', 'CC'], sortOrder: 2 },
              { description: 'Tumia kiimbo kinachofaa katika sentensi', code: 'KISW-MAI-03', grade: 5, competencies: ['LIN', 'CC'], sortOrder: 3 },
            ]
          },
          {
            name: 'Mazungumzo', code: 'KISW-MAZ', description: 'Conversations and dialogues',
            applicableGrades: [6, 7, 8], sortOrder: 2, learningOutcomes: [
              { description: 'Shiriki katika mazungumzo kuhusu mada mbalimbali', code: 'KISW-MAZ-01', grade: 6, competencies: ['LIN', 'CC'], sortOrder: 1 },
              { description: 'Toa maoni na hoja katika mijadala', code: 'KISW-MAZ-02', grade: 7, competencies: ['LIN', 'CC', 'CTPS'], sortOrder: 2 },
              { description: 'Wasilisha hotuba fupi kwa usahihi', code: 'KISW-MAZ-03', grade: 8, competencies: ['LIN', 'CC', 'CI'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Kusoma', code: 'KISW-KUS', description: 'Reading comprehension',
        applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 2, subStrands: [
          {
            name: 'Ufahamu wa Kusoma', code: 'KISW-UFA', description: 'Reading comprehension',
            applicableGrades: [3, 4, 5], sortOrder: 1, learningOutcomes: [
              { description: 'Soma vifungu kwa usahihi na ufasaha', code: 'KISW-UFA-01', grade: 3, competencies: ['LIN'], sortOrder: 1 },
              { description: 'Tambua wazo kuu katika kifungu', code: 'KISW-UFA-02', grade: 4, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
              { description: 'Jibu maswali ya ufahamu kwa usahihi', code: 'KISW-UFA-03', grade: 5, competencies: ['LIN', 'CC'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Kuandika', code: 'KISW-KUA', description: 'Writing skills',
        applicableGrades: [3, 4, 5, 6, 7, 8], sortOrder: 3, subStrands: [
          {
            name: 'Insha na Utungaji', code: 'KISW-INS', description: 'Composition writing',
            applicableGrades: [4, 5, 6, 7, 8], sortOrder: 1, learningOutcomes: [
              { description: 'Andika sentensi sahihi kuhusu mada mbalimbali', code: 'KISW-INS-01', grade: 4, competencies: ['LIN', 'CI'], sortOrder: 1 },
              { description: 'Andika aya yenye wazo kuu', code: 'KISW-INS-02', grade: 5, competencies: ['LIN', 'CI', 'CTPS'], sortOrder: 2 },
              { description: 'Andika insha za kueleza na kuelezea', code: 'KISW-INS-03', grade: 6, competencies: ['LIN', 'CI'], sortOrder: 3 },
              { description: 'Andika insha za kubuni na za kusisimua', code: 'KISW-INS-04', grade: 7, competencies: ['LIN', 'CI', 'CC'], sortOrder: 4 },
              { description: 'Andika barua na taarifa kwa muundo sahihi', code: 'KISW-INS-05', grade: 8, competencies: ['LIN', 'CC', 'CIT'], sortOrder: 5 },
            ]
          },
        ]
      },
      {
        name: 'Sarufi', code: 'KISW-SAR', description: 'Kiswahili grammar',
        applicableGrades: [4, 5, 6, 7, 8], sortOrder: 4, subStrands: [
          {
            name: 'Aina za Maneno', code: 'KISW-AZM', description: 'Parts of speech',
            applicableGrades: [4, 5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Tambua nomino na vitenzi', code: 'KISW-AZM-01', grade: 4, competencies: ['LIN'], sortOrder: 1 },
              { description: 'Tambua vivumishi na vielezi', code: 'KISW-AZM-02', grade: 5, competencies: ['LIN'], sortOrder: 2 },
              { description: 'Tumia viwakilishi na vihusishi kwa usahihi', code: 'KISW-AZM-03', grade: 6, competencies: ['LIN'], sortOrder: 3 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Science and Technology', code: 'SCI', description: 'Integrated science for upper primary',
    icon: 'flask', color: '#7C3AED', applicableGrades: [5, 6, 7, 8], gradeRange: [5, 8],
    strands: [
      {
        name: 'Living Things', code: 'SCI-LIV', description: 'Study of living organisms and their environments',
        applicableGrades: [5, 6, 7, 8], sortOrder: 1, subStrands: [
          {
            name: 'Plants', code: 'SCI-PLA', description: 'Plant structure and growth',
            applicableGrades: [5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Identify parts of a flowering plant', code: 'SCI-PLA-01', grade: 5, competencies: ['SCI', 'CC'], sortOrder: 1 },
              { description: 'Describe conditions necessary for seed germination', code: 'SCI-PLA-02', grade: 5, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
              { description: 'Explain photosynthesis process', code: 'SCI-PLA-03', grade: 6, competencies: ['SCI', 'CTPS'], sortOrder: 3 },
            ]
          },
          {
            name: 'Animals', code: 'SCI-ANI', description: 'Animal classification and systems',
            applicableGrades: [5, 6, 7, 8], sortOrder: 2, learningOutcomes: [
              { description: 'Classify animals into vertebrates and invertebrates', code: 'SCI-ANI-01', grade: 5, competencies: ['SCI', 'CTPS'], sortOrder: 1 },
              { description: 'Describe life cycles of common animals', code: 'SCI-ANI-02', grade: 6, competencies: ['SCI'], sortOrder: 2 },
              { description: 'Explain the human digestive system', code: 'SCI-ANI-03', grade: 7, competencies: ['SCI', 'CTPS'], sortOrder: 3 },
              { description: 'Explain the human circulatory system', code: 'SCI-ANI-04', grade: 8, competencies: ['SCI', 'CTPS'], sortOrder: 4 },
            ]
          },
          {
            name: 'Ecosystem', code: 'SCI-ECO', description: 'Understanding ecosystems and habitats',
            applicableGrades: [5, 6, 7, 8], sortOrder: 3, learningOutcomes: [
              { description: 'Identify components of a local ecosystem', code: 'SCI-ECO-01', grade: 5, competencies: ['SCI', 'ENV'], sortOrder: 1 },
              { description: 'Describe food chains and food webs', code: 'SCI-ECO-02', grade: 6, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
              { description: 'Explain energy flow in an ecosystem', code: 'SCI-ECO-03', grade: 7, competencies: ['SCI', 'CTPS'], sortOrder: 3 },
              { description: 'Evaluate human impact on ecosystems', code: 'SCI-ECO-04', grade: 8, competencies: ['SCI', 'CIT', 'ENV'], sortOrder: 4 },
            ]
          },
        ]
      },
      {
        name: 'Energy and Change', code: 'SCI-ENE', description: 'Study of energy forms and transformations',
        applicableGrades: [5, 6, 7, 8], sortOrder: 2, subStrands: [
          {
            name: 'Forms of Energy', code: 'SCI-FOE', description: 'Different forms of energy',
            applicableGrades: [5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Identify forms of energy (light, heat, sound)', code: 'SCI-FOE-01', grade: 5, competencies: ['SCI'], sortOrder: 1 },
              { description: 'Demonstrate energy transformation examples', code: 'SCI-FOE-02', grade: 6, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
            ]
          },
          {
            name: 'Electricity', code: 'SCI-ELE', description: 'Basic electrical concepts',
            applicableGrades: [6, 7, 8], sortOrder: 2, learningOutcomes: [
              { description: 'Construct simple electric circuits', code: 'SCI-ELE-01', grade: 6, competencies: ['SCI', 'TEC'], sortOrder: 1 },
              { description: 'Differentiate between conductors and insulators', code: 'SCI-ELE-02', grade: 7, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
              { description: 'Calculate basic electrical quantities', code: 'SCI-ELE-03', grade: 8, competencies: ['MC', 'SCI', 'CTPS'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Matter and Materials', code: 'SCI-MAT', description: 'Properties of matter and materials',
        applicableGrades: [5, 6, 7, 8], sortOrder: 3, subStrands: [
          {
            name: 'States of Matter', code: 'SCI-SOM', description: 'States and properties of matter',
            applicableGrades: [5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Identify states of matter (solid, liquid, gas)', code: 'SCI-SOM-01', grade: 5, competencies: ['SCI', 'CC'], sortOrder: 1 },
              { description: 'Describe changes of state (melting, freezing, boiling)', code: 'SCI-SOM-02', grade: 6, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
            ]
          },
          {
            name: 'Mixtures and Solutions', code: 'SCI-MIS', description: 'Separating mixtures and solutions',
            applicableGrades: [7, 8], sortOrder: 2, learningOutcomes: [
              { description: 'Separate mixtures using filtration and evaporation', code: 'SCI-MIS-01', grade: 7, competencies: ['SCI', 'CTPS'], sortOrder: 1 },
              { description: 'Distinguish between solutions, suspensions and colloids', code: 'SCI-MIS-02', grade: 8, competencies: ['SCI', 'CTPS'], sortOrder: 2 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Social Studies', code: 'SOC', description: 'Understanding society, history, geography and citizenship',
    icon: 'globe', color: '#DC2626', applicableGrades: [5, 6, 7, 8, 9], gradeRange: [5, 9],
    strands: [
      {
        name: 'People and Population', code: 'SOC-POP', description: 'Study of human population and diversity',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 1, subStrands: [
          {
            name: 'Our Country Kenya', code: 'SOC-KEN', description: 'Geography and people of Kenya',
            applicableGrades: [5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Identify counties in Kenya', code: 'SOC-KEN-01', grade: 5, competencies: ['CIT'], sortOrder: 1 },
              { description: 'Describe ethnic diversity in Kenya', code: 'SOC-KEN-02', grade: 5, competencies: ['CIT', 'CC'], sortOrder: 2 },
              { description: 'Locate major physical features of Kenya', code: 'SOC-KEN-03', grade: 6, competencies: ['CIT', 'CTPS'], sortOrder: 3 },
            ]
          },
          {
            name: 'World Population', code: 'SOC-WPOP', description: 'Global population patterns',
            applicableGrades: [7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Describe world population distribution', code: 'SOC-WPOP-01', grade: 7, competencies: ['CTPS', 'CIT'], sortOrder: 1 },
              { description: 'Analyse factors influencing population growth', code: 'SOC-WPOP-02', grade: 8, competencies: ['CTPS', 'CIT'], sortOrder: 2 },
              { description: 'Evaluate effects of population on resources', code: 'SOC-WPOP-03', grade: 9, competencies: ['CTPS', 'CIT', 'ENV'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Resources and Economic Activities', code: 'SOC-RES', description: 'Natural resources and economic activities',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 2, subStrands: [
          {
            name: 'Natural Resources', code: 'SOC-NAT', description: 'Kenya\'s natural resources',
            applicableGrades: [5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Identify natural resources in Kenya', code: 'SOC-NAT-01', grade: 5, competencies: ['ENV'], sortOrder: 1 },
              { description: 'Classify resources as renewable and non-renewable', code: 'SOC-NAT-02', grade: 6, competencies: ['CTPS', 'ENV'], sortOrder: 2 },
            ]
          },
          {
            name: 'Economic Activities', code: 'SOC-ECO', description: 'Economic activities in Kenya',
            applicableGrades: [6, 7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Describe farming systems in Kenya', code: 'SOC-ECO-01', grade: 6, competencies: ['ENT', 'CIT'], sortOrder: 1 },
              { description: 'Explain manufacturing industries in Kenya', code: 'SOC-ECO-02', grade: 7, competencies: ['ENT', 'CIT'], sortOrder: 2 },
              { description: 'Describe trade and transport networks', code: 'SOC-ECO-03', grade: 8, competencies: ['ENT', 'CTPS'], sortOrder: 3 },
              { description: 'Analyse tourism as an economic activity', code: 'SOC-ECO-04', grade: 9, competencies: ['ENT', 'CIT', 'ENV'], sortOrder: 4 },
            ]
          },
        ]
      },
      {
        name: 'Government and Citizenship', code: 'SOC-GOV', description: 'Government structures and citizenship',
        applicableGrades: [6, 7, 8, 9], sortOrder: 3, subStrands: [
          {
            name: 'Government of Kenya', code: 'SOC-GOK', description: 'Structure and functions of government',
            applicableGrades: [6, 7], sortOrder: 1, learningOutcomes: [
              { description: 'Identify the three arms of government', code: 'SOC-GOK-01', grade: 6, competencies: ['CIT'], sortOrder: 1 },
              { description: 'Describe functions of the executive, legislature and judiciary', code: 'SOC-GOK-02', grade: 7, competencies: ['CIT', 'CC'], sortOrder: 2 },
            ]
          },
          {
            name: 'Citizenship and Human Rights', code: 'SOC-CIT', description: 'Rights and responsibilities of citizens',
            applicableGrades: [7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Explain rights and responsibilities of citizens', code: 'SOC-CIT-01', grade: 7, competencies: ['CIT', 'CC'], sortOrder: 1 },
              { description: 'Describe the Bill of Rights in Kenya\'s constitution', code: 'SOC-CIT-02', grade: 8, competencies: ['CIT', 'CC'], sortOrder: 2 },
              { description: 'Demonstrate democratic participation', code: 'SOC-CIT-03', grade: 9, competencies: ['CIT', 'CC', 'CTPS'], sortOrder: 3 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Pre-Technical and Pre-Career Studies', code: 'PTC', description: 'Foundational technical and career skills',
    icon: 'wrench', color: '#0891B2', applicableGrades: [7, 8, 9], gradeRange: [7, 9],
    strands: [
      {
        name: 'Technical Skills', code: 'PTC-TEC', description: 'Foundational technical skills',
        applicableGrades: [7, 8, 9], sortOrder: 1, subStrands: [
          {
            name: 'Drawing and Design', code: 'PTC-DAD', description: 'Basic drawing and design principles',
            applicableGrades: [7, 8], sortOrder: 1, learningOutcomes: [
              { description: 'Use drawing instruments correctly', code: 'PTC-DAD-01', grade: 7, competencies: ['TEC', 'PSY'], sortOrder: 1 },
              { description: 'Apply design process to solve problems', code: 'PTC-DAD-02', grade: 8, competencies: ['TEC', 'CTPS', 'CI'], sortOrder: 2 },
            ]
          },
          {
            name: 'Materials and Tools', code: 'PTC-MAT', description: 'Understanding materials and tools',
            applicableGrades: [7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Identify common materials used in technology', code: 'PTC-MAT-01', grade: 7, competencies: ['TEC', 'CC'], sortOrder: 1 },
              { description: 'Select appropriate tools for tasks', code: 'PTC-MAT-02', grade: 8, competencies: ['TEC', 'CTPS'], sortOrder: 2 },
              { description: 'Apply safety precautions when using tools', code: 'PTC-MAT-03', grade: 9, competencies: ['TEC', 'SE'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Career Studies', code: 'PTC-CAR', description: 'Career awareness and entrepreneurship',
        applicableGrades: [8, 9], sortOrder: 2, subStrands: [
          {
            name: 'Career Pathways', code: 'PTC-CPW', description: 'Exploring career options',
            applicableGrades: [8, 9], sortOrder: 1, learningOutcomes: [
              { description: 'Identify career clusters and pathways', code: 'PTC-CPW-01', grade: 8, competencies: ['ENT', 'LL'], sortOrder: 1 },
              { description: 'Relate subjects to career options', code: 'PTC-CPW-02', grade: 9, competencies: ['ENT', 'LL', 'SE'], sortOrder: 2 },
            ]
          },
          {
            name: 'Entrepreneurship', code: 'PTC-ENT', description: 'Basic entrepreneurship skills',
            applicableGrades: [8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Identify business opportunities in the community', code: 'PTC-ENT-01', grade: 8, competencies: ['ENT', 'CI'], sortOrder: 1 },
              { description: 'Develop a simple business plan', code: 'PTC-ENT-02', grade: 9, competencies: ['ENT', 'CTPS', 'MC'], sortOrder: 2 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Agriculture', code: 'AGR', description: 'Agricultural skills and food production',
    icon: 'sprout', color: '#15803D', applicableGrades: [5, 6, 7, 8, 9], gradeRange: [5, 9],
    strands: [
      {
        name: 'Crop Production', code: 'AGR-CRP', description: 'Growing crops',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 1, subStrands: [
          {
            name: 'Food Crops', code: 'AGR-FDC', description: 'Growing food crops',
            applicableGrades: [5, 6, 7], sortOrder: 1, learningOutcomes: [
              { description: 'Prepare land for planting vegetables', code: 'AGR-FDC-01', grade: 5, competencies: ['ENT', 'PSY'], sortOrder: 1 },
              { description: 'Plant and care for food crops', code: 'AGR-FDC-02', grade: 6, competencies: ['ENT', 'CTPS'], sortOrder: 2 },
              { description: 'Harvest and store crops properly', code: 'AGR-FDC-03', grade: 7, competencies: ['ENT', 'CTPS', 'ENV'], sortOrder: 3 },
            ]
          },
          {
            name: 'Cash Crops', code: 'AGR-CAC', description: 'Growing cash crops',
            applicableGrades: [7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Identify cash crops grown in Kenya', code: 'AGR-CAC-01', grade: 7, competencies: ['ENT', 'CIT'], sortOrder: 1 },
              { description: 'Describe value addition in cash crops', code: 'AGR-CAC-02', grade: 8, competencies: ['ENT', 'CTPS'], sortOrder: 2 },
              { description: 'Analyse market opportunities for cash crops', code: 'AGR-CAC-03', grade: 9, competencies: ['ENT', 'CTPS', 'CIT'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Animal Production', code: 'AGR-ANM', description: 'Rearing animals',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 2, subStrands: [
          {
            name: 'Livestock', code: 'AGR-LVS', description: 'Rearing livestock',
            applicableGrades: [5, 6, 7], sortOrder: 1, learningOutcomes: [
              { description: 'Identify common livestock in the locality', code: 'AGR-LVS-01', grade: 5, competencies: ['ENT'], sortOrder: 1 },
              { description: 'Construct simple animal shelters', code: 'AGR-LVS-02', grade: 6, competencies: ['ENT', 'PSY'], sortOrder: 2 },
              { description: 'Feed and care for livestock', code: 'AGR-LVS-03', grade: 7, competencies: ['ENT', 'CTPS'], sortOrder: 3 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Creative Arts and Sports', code: 'CAS', description: 'Creative and physical expression',
    icon: 'palette', color: '#DB2777', applicableGrades: [5, 6, 7, 8, 9], gradeRange: [5, 9],
    strands: [
      {
        name: 'Visual Arts', code: 'CAS-VIS', description: 'Visual art creation and appreciation',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 1, subStrands: [
          {
            name: 'Drawing and Painting', code: 'CAS-DAP', description: 'Techniques in drawing and painting',
            applicableGrades: [5, 6, 7], sortOrder: 1, learningOutcomes: [
              { description: 'Draw objects from observation', code: 'CAS-DAP-01', grade: 5, competencies: ['CI', 'PSY'], sortOrder: 1 },
              { description: 'Mix colours to create new shades', code: 'CAS-DAP-02', grade: 6, competencies: ['CI', 'ART'], sortOrder: 2 },
              { description: 'Create a composition using painting techniques', code: 'CAS-DAP-03', grade: 7, competencies: ['CI', 'ART', 'CC'], sortOrder: 3 },
            ]
          },
          {
            name: 'Sculpture and Craft', code: 'CAS-SAC', description: 'Three-dimensional art forms',
            applicableGrades: [7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Model simple forms using clay', code: 'CAS-SAC-01', grade: 7, competencies: ['CI', 'PSY'], sortOrder: 1 },
              { description: 'Create functional craft items', code: 'CAS-SAC-02', grade: 8, competencies: ['CI', 'ENT'], sortOrder: 2 },
              { description: 'Apply decorative techniques to crafts', code: 'CAS-SAC-03', grade: 9, competencies: ['CI', 'ART', 'ENT'], sortOrder: 3 },
            ]
          },
        ]
      },
      {
        name: 'Physical Education and Sports', code: 'CAS-PES', description: 'Physical fitness and sports skills',
        applicableGrades: [5, 6, 7, 8, 9], sortOrder: 2, subStrands: [
          {
            name: 'Athletics', code: 'CAS-ATH', description: 'Track and field events',
            applicableGrades: [5, 6, 7, 8, 9], sortOrder: 1, learningOutcomes: [
              { description: 'Perform running techniques correctly', code: 'CAS-ATH-01', grade: 5, competencies: ['PSY', 'SE'], sortOrder: 1 },
              { description: 'Perform jumping techniques correctly', code: 'CAS-ATH-02', grade: 6, competencies: ['PSY', 'SE'], sortOrder: 2 },
              { description: 'Perform throwing techniques correctly', code: 'CAS-ATH-03', grade: 7, competencies: ['PSY', 'SE'], sortOrder: 3 },
              { description: 'Apply rules in athletics events', code: 'CAS-ATH-04', grade: 8, competencies: ['PSY', 'CIT'], sortOrder: 4 },
              { description: 'Demonstrate sportsmanship during competition', code: 'CAS-ATH-05', grade: 9, competencies: ['PSY', 'CIT', 'CC'], sortOrder: 5 },
            ]
          },
          {
            name: 'Ball Games', code: 'CAS-BLG', description: 'Team ball games',
            applicableGrades: [6, 7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Perform basic ball handling skills', code: 'CAS-BLG-01', grade: 6, competencies: ['PSY', 'CC'], sortOrder: 1 },
              { description: 'Apply rules in ball games', code: 'CAS-BLG-02', grade: 7, competencies: ['PSY', 'CIT'], sortOrder: 2 },
              { description: 'Demonstrate teamwork in ball games', code: 'CAS-BLG-03', grade: 8, competencies: ['PSY', 'CC', 'CIT'], sortOrder: 3 },
              { description: 'Plan offensive and defensive strategies', code: 'CAS-BLG-04', grade: 9, competencies: ['PSY', 'CTPS', 'CC'], sortOrder: 4 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Religious Education (CRE)', code: 'CRE', description: 'Christian Religious Education',
    icon: 'church', color: '#9333EA', applicableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9], gradeRange: [1, 9],
    strands: [
      {
        name: 'Creation and the Bible', code: 'CRE-CRE', description: 'Understanding creation and Bible stories',
        applicableGrades: [3, 4, 5, 6, 7, 8, 9], sortOrder: 1, subStrands: [
          {
            name: 'Bible Stories', code: 'CRE-BST', description: 'Key stories from the Bible',
            applicableGrades: [3, 4, 5, 6], sortOrder: 1, learningOutcomes: [
              { description: 'Retell the story of creation', code: 'CRE-BST-01', grade: 3, competencies: ['SPI'], sortOrder: 1 },
              { description: 'Retell stories about Abraham and Moses', code: 'CRE-BST-02', grade: 4, competencies: ['SPI', 'CC'], sortOrder: 2 },
              { description: 'Describe the life of Jesus', code: 'CRE-BST-03', grade: 5, competencies: ['SPI', 'CC'], sortOrder: 3 },
              { description: 'Explain the meaning of parables', code: 'CRE-BST-04', grade: 6, competencies: ['SPI', 'CTPS'], sortOrder: 4 },
            ]
          },
          {
            name: 'Christian Values', code: 'CRE-CVA', description: 'Christian values and their application',
            applicableGrades: [5, 6, 7, 8, 9], sortOrder: 2, learningOutcomes: [
              { description: 'Demonstrate love and kindness to others', code: 'CRE-CVA-01', grade: 5, competencies: ['SPI', 'CIT'], sortOrder: 1 },
              { description: 'Practice honesty and integrity', code: 'CRE-CVA-02', grade: 6, competencies: ['SPI', 'CIT'], sortOrder: 2 },
              { description: 'Apply forgiveness in daily life', code: 'CRE-CVA-03', grade: 7, competencies: ['SPI', 'CC'], sortOrder: 3 },
              { description: 'Demonstrate responsible decision-making', code: 'CRE-CVA-04', grade: 8, competencies: ['SPI', 'CTPS', 'SE'], sortOrder: 4 },
              { description: 'Apply Christian teachings to contemporary issues', code: 'CRE-CVA-05', grade: 9, competencies: ['SPI', 'CTPS', 'CIT'], sortOrder: 5 },
            ]
          },
        ]
      },
    ],
  },
  {
    name: 'Indigenous Languages', code: 'ILG', description: 'Study of indigenous Kenyan languages',
    icon: 'book', color: '#A16207', applicableGrades: [5, 6, 7, 8], gradeRange: [5, 8],
    strands: [
      {
        name: 'Listening and Speaking', code: 'ILG-LIS', description: 'Oral language skills',
        applicableGrades: [5, 6, 7, 8], sortOrder: 1, subStrands: [
          {
            name: 'Oral Literature', code: 'ILG-OLT', description: 'Oral stories and traditions',
            applicableGrades: [5, 6, 7, 8], sortOrder: 1, learningOutcomes: [
              { description: 'Retell traditional stories from the community', code: 'ILG-OLT-01', grade: 5, competencies: ['LIN', 'CC'], sortOrder: 1 },
              { description: 'Recite poems and riddles in the indigenous language', code: 'ILG-OLT-02', grade: 6, competencies: ['LIN', 'CI'], sortOrder: 2 },
              { description: 'Explain proverbs and their meanings', code: 'ILG-OLT-03', grade: 7, competencies: ['LIN', 'CTPS'], sortOrder: 3 },
              { description: 'Present oral narratives to an audience', code: 'ILG-OLT-04', grade: 8, competencies: ['LIN', 'CC', 'CI'], sortOrder: 4 },
            ]
          },
        ]
      },
      {
        name: 'Reading and Writing', code: 'ILG-RWR', description: 'Literacy in indigenous language',
        applicableGrades: [5, 6, 7, 8], sortOrder: 2, subStrands: [
          {
            name: 'Reading Comprehension', code: 'ILG-RCO', description: 'Reading and understanding texts',
            applicableGrades: [5, 6, 7, 8], sortOrder: 1, learningOutcomes: [
              { description: 'Read simple texts in the indigenous language', code: 'ILG-RCO-01', grade: 5, competencies: ['LIN'], sortOrder: 1 },
              { description: 'Identify main ideas in texts', code: 'ILG-RCO-02', grade: 6, competencies: ['LIN', 'CTPS'], sortOrder: 2 },
              { description: 'Write short compositions in the indigenous language', code: 'ILG-RCO-03', grade: 7, competencies: ['LIN', 'CI'], sortOrder: 3 },
              { description: 'Translate simple texts between languages', code: 'ILG-RCO-04', grade: 8, competencies: ['LIN', 'CTPS', 'CC'], sortOrder: 4 },
            ]
          },
        ]
      },
    ],
  },
];
