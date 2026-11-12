// Starter MATLAB programs. Each mirrors one of the C examples so the two
// languages can be read side by side.

export interface Example {
  id: string;
  lang: string;
  name: string;
  filename: string;
  code: string;
}

export const MATLAB_EXAMPLES: Example[] = [
  {
    id: "matlab-hello",
    lang: "matlab",
    name: "Hello, World",
    filename: "hello.m",
    code: `% A script runs from top to bottom. No main function is needed.
disp('Hello, World!');

% fprintf works like printf in C. \\n ends the line.
fprintf('2 + 3 = %d\\n', 2 + 3);
`,
  },
  {
    id: "matlab-input",
    lang: "matlab",
    name: "Read a number",
    filename: "year_of_birth.m",
    code: `% input shows a prompt and waits for the user to type a value.
age = input('How old are you? ');

year = 2026 - age;
fprintf('You were born in about %d.\\n', year);
`,
  },
  {
    id: "matlab-if",
    lang: "matlab",
    name: "If and else",
    filename: "positive_negative.m",
    code: `n = input('Enter a number: ');

% Blocks end with the word "end" instead of a closing brace.
if n > 0
    disp('Positive');
elseif n < 0
    disp('Negative');
else
    disp('Zero');
end
`,
  },
  {
    id: "matlab-loop",
    lang: "matlab",
    name: "Sum with a loop",
    filename: "sum_loop.m",
    code: `% 1:5 means the numbers 1, 2, 3, 4, 5.
total = 0;
for k = 1:5
    total = total + k;
end
fprintf('Sum of 1 to 5 is %d\\n', total);

% The same sum without a loop: MATLAB works on whole lists at once.
fprintf('Using sum(): %d\\n', sum(1:5));
`,
  },
  {
    id: "matlab-array",
    lang: "matlab",
    name: "Arrays start at 1",
    filename: "arrays.m",
    code: `marks = [72, 58, 91, 64];

% The first element is marks(1), not marks(0) as in C.
fprintf('First mark: %d\\n', marks(1));
fprintf('Number of marks: %d\\n', numel(marks));
fprintf('Average: %.1f\\n', mean(marks));
fprintf('Highest: %d\\n', max(marks));
`,
  },
  {
    id: "matlab-function",
    lang: "matlab",
    name: "A function",
    filename: "area_of_circle.m",
    code: `% In a script file, functions go at the end.
r = 2.5;
fprintf('Area = %.2f\\n', circle_area(r));

function a = circle_area(radius)
    % The output variable "a" is what the function returns.
    a = pi * radius^2;
end
`,
  },
];
