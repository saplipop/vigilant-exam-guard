
INSERT INTO public.exams (id, title, description, duration_minutes, total_marks, passing_marks, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Data Structures & Algorithms', 'Comprehensive exam covering arrays, linked lists, trees, sorting algorithms, and graph theory.', 45, 50, 20, true),
  ('22222222-2222-2222-2222-222222222222', 'Web Development Fundamentals', 'Test your knowledge of HTML, CSS, JavaScript, and modern web frameworks.', 30, 40, 16, true),
  ('33333333-3333-3333-3333-333333333333', 'Database Management Systems', 'Exam covering SQL, normalization, indexing, transactions, and NoSQL concepts.', 60, 60, 24, false);

INSERT INTO public.questions (exam_id, question_text, question_type, options, correct_answer, marks, order_num)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'What is the time complexity of binary search?', 'mcq', '["O(n)", "O(log n)", "O(n²)", "O(1)"]', 'O(log n)', 5, 1),
  ('11111111-1111-1111-1111-111111111111', 'Which data structure uses LIFO principle?', 'mcq', '["Queue", "Stack", "Array", "Linked List"]', 'Stack', 5, 2),
  ('11111111-1111-1111-1111-111111111111', 'What is the worst-case time complexity of quicksort?', 'mcq', '["O(n log n)", "O(n)", "O(n²)", "O(log n)"]', 'O(n²)', 5, 3),
  ('11111111-1111-1111-1111-111111111111', 'Explain the difference between BFS and DFS traversal algorithms.', 'subjective', NULL, NULL, 10, 4),
  ('11111111-1111-1111-1111-111111111111', 'Which sorting algorithm is most efficient for nearly sorted arrays?', 'mcq', '["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"]', 'Insertion Sort', 5, 5),
  ('11111111-1111-1111-1111-111111111111', 'What is a balanced binary search tree?', 'mcq', '["AVL Tree", "Linked List", "Hash Table", "Graph"]', 'AVL Tree', 5, 6),
  ('11111111-1111-1111-1111-111111111111', 'Describe the concept of dynamic programming with an example.', 'subjective', NULL, NULL, 15, 7),
  ('22222222-2222-2222-2222-222222222222', 'What does CSS stand for?', 'mcq', '["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"]', 'Cascading Style Sheets', 5, 1),
  ('22222222-2222-2222-2222-222222222222', 'Which HTML tag is used for the largest heading?', 'mcq', '["<h6>", "<heading>", "<h1>", "<head>"]', '<h1>', 5, 2),
  ('22222222-2222-2222-2222-222222222222', 'What is the purpose of the useEffect hook in React?', 'subjective', NULL, NULL, 10, 3),
  ('22222222-2222-2222-2222-222222222222', 'Which method converts JSON string to JavaScript object?', 'mcq', '["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.toObject()"]', 'JSON.parse()', 5, 4),
  ('22222222-2222-2222-2222-222222222222', 'What is the box model in CSS?', 'mcq', '["Content + Padding + Border + Margin", "Only Content", "Content + Border", "Padding + Margin"]', 'Content + Padding + Border + Margin', 5, 5),
  ('22222222-2222-2222-2222-222222222222', 'Explain the concept of closures in JavaScript.', 'subjective', NULL, NULL, 10, 6);
