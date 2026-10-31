import { VideoItem, DocumentItem, CodingProblem, InterviewQuestion, LearningAnalytics } from './types.js';

export const DEMO_USER = {
  id: 'usr_noexnova_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@learnova.edu',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  role: 'student' as const,
  enrolledCourses: ['course_ml_101', 'course_dsa_201', 'course_fullstack_301'],
  joinedAt: '2026-09-01T08:00:00Z',
};

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid_ml_01',
    title: 'Machine Learning Foundations: Supervised, Unsupervised & Evaluation',
    description: 'A comprehensive lecture covering ML concepts from foundational definitions to evaluation metrics and bias-variance tradeoff.',
    youtubeId: 'aircAruvnKk', // 3Blue1Brown Neural Networks / ML
    youtubeUrl: 'https://www.youtube.com/watch?v=aircAruvnKk',
    durationSeconds: 2520, // 42 minutes
    durationFormatted: '42:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600',
    category: 'Machine Learning',
    level: 'Beginner',
    keyTopics: [
      { timestamp: 0, label: '00:00 - Introduction to ML' },
      { timestamp: 300, label: '05:00 - Supervised Learning' },
      { timestamp: 600, label: '10:00 - Unsupervised Learning' },
      { timestamp: 1122, label: '18:42 - Model Evaluation & Metrics' },
      { timestamp: 2100, label: '35:00 - Overfitting & Underfitting' },
    ],
    transcripts: [
      {
        id: 'ts_ml_01',
        start: 0,
        end: 299,
        timestampFormatted: '00:00',
        title: 'Introduction to Machine Learning',
        text: 'Welcome to Machine Learning Foundations. Machine learning is the field of study that gives computers the ability to learn without being explicitly programmed, as coined by Arthur Samuel. Instead of writing hand-crafted heuristic rules, we feed mathematical models historical data with features and patterns. The algorithm adjusts internal parameters to minimize error and discover predictive mappings.',
      },
      {
        id: 'ts_ml_02',
        start: 300,
        end: 599,
        timestampFormatted: '05:00',
        title: 'Supervised Learning',
        text: 'At minute 5, we introduce Supervised Learning. In supervised learning, the training dataset contains both inputs (features X) and known ground truth targets (labels Y). The two primary branches are Classification, where target labels are discrete categorical classes (such as spam vs non-spam, or medical diagnosis), and Regression, where target labels are continuous numerical values (such as predicting house prices or temperature). Common algorithms include Linear Regression, Logistic Regression, Decision Trees, and Support Vector Machines.',
      },
      {
        id: 'ts_ml_03',
        start: 600,
        end: 1121,
        timestampFormatted: '10:00',
        title: 'Unsupervised Learning',
        text: 'Moving to minute 10, we explore Unsupervised Learning. Here, our data has no pre-existing ground truth labels. The objective is to discover latent geometric structure, probability distributions, or groupings within the dataset. Principal techniques include Clustering (such as K-Means clustering and DBSCAN) which partitions samples into cohesive clusters, and Dimensionality Reduction (such as PCA or t-SNE) which compresses high-dimensional feature spaces into lower dimensions while preserving pairwise variance.',
      },
      {
        id: 'ts_ml_04',
        start: 1122,
        end: 2099,
        timestampFormatted: '18:42',
        title: 'Introduction to Model Evaluation',
        text: 'At timestamp 18:42, we examine Model Evaluation. How do we verify if our trained model generalizes well to unseen real-world data? We partition our raw data into training, validation, and holdout test sets. For classification tasks, we evaluate accuracy, precision (true positives over all predicted positives), recall (true positives over all actual positives), and F1-score. For regression tasks, we measure Mean Squared Error (MSE), Root Mean Squared Error (RMSE), and R-squared.',
      },
      {
        id: 'ts_ml_05',
        start: 2100,
        end: 2520,
        timestampFormatted: '35:00',
        title: 'Overfitting and Underfitting',
        text: 'At minute 35:00, we dive deep into Overfitting and Underfitting. Overfitting occurs when a high-capacity model memorizes statistical noise and peculiarities of the training dataset rather than true underlying relationships. Symptoms include near 100% training accuracy but abysmal validation performance (high variance). To combat overfitting, practitioners employ L1/L2 regularization, dropout in neural nets, pruning in decision trees, early stopping, and K-fold cross-validation. Conversely, underfitting happens when the model is too simplistic to capture fundamental trends (high bias).',
      },
    ],
  },
  {
    id: 'vid_dsa_02',
    title: 'Data Structures & Algorithms: Binary Search to Graph Traversal',
    description: 'Master time complexity, binary search patterns, DFS, BFS, and shortest path algorithms.',
    youtubeId: '8hly31xKli0',
    youtubeUrl: 'https://www.youtube.com/watch?v=8hly31xKli0',
    durationSeconds: 1800,
    durationFormatted: '30:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516116211227-bbc675b839aa?auto=format&fit=crop&q=80&w=600',
    category: 'Computer Science',
    level: 'Intermediate',
    keyTopics: [
      { timestamp: 0, label: '00:00 - Big-O Complexity' },
      { timestamp: 360, label: '06:00 - Binary Search Algorithm' },
      { timestamp: 900, label: '15:00 - Tree Traversals (Inorder/Preorder)' },
      { timestamp: 1440, label: '24:00 - Graph BFS & DFS' },
    ],
    transcripts: [
      {
        id: 'ts_dsa_01',
        start: 0,
        end: 359,
        timestampFormatted: '00:00',
        title: 'Big-O Analysis',
        text: 'In algorithms, Big-O notation quantifies upper bounds on worst-case execution time and auxiliary space consumption as input size n grows asymptotically. O(1) denotes constant time, O(log n) logarithmic, O(n) linear, O(n log n) linearithmic (like merge sort), and O(n^2) quadratic.',
      },
      {
        id: 'ts_dsa_02',
        start: 360,
        end: 899,
        timestampFormatted: '06:00',
        title: 'Binary Search',
        text: 'Binary Search operates on monotonic sorted sequences in O(log n) time. By maintaining two pointers (left and right) and evaluating middle element mid = left + (right - left) // 2, we halve the remaining search space every single comparison.',
      },
      {
        id: 'ts_dsa_03',
        start: 900,
        end: 1439,
        timestampFormatted: '15:00',
        title: 'Binary Trees and Traversals',
        text: 'A Binary Search Tree guarantees that every left descendant key is strictly less than the root node key, and right descendant key is greater. Inorder traversal (Left, Root, Right) produces sorted order in linear O(n) time.',
      },
      {
        id: 'ts_dsa_04',
        start: 1440,
        end: 1800,
        timestampFormatted: '24:00',
        title: 'Graph Traversals (BFS and DFS)',
        text: 'Breadth-First Search (BFS) utilizes a FIFO queue to explore nodes level-by-level, ideal for unweighted shortest paths. Depth-First Search (DFS) utilizes a LIFO call stack to traverse down branches until backtracking.',
      },
    ],
  },
  {
    id: 'vid_web_03',
    title: 'Modern Full-Stack Engineering: RESTful APIs, Auth & Microservices',
    description: 'Architecting scalable server backends, JWT token authentication, and clean API endpoints.',
    youtubeId: '-MTSQjw5DrM',
    youtubeUrl: 'https://www.youtube.com/watch?v=-MTSQjw5DrM',
    durationSeconds: 2400,
    durationFormatted: '40:00',
    thumbnailUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=600',
    category: 'Full Stack',
    level: 'Intermediate',
    keyTopics: [
      { timestamp: 0, label: '00:00 - Client-Server Model' },
      { timestamp: 480, label: '08:00 - RESTful HTTP Constraints' },
      { timestamp: 1200, label: '20:00 - Stateless JWT Authentication' },
      { timestamp: 1800, label: '30:00 - Database Transactions & ACID' },
    ],
    transcripts: [
      {
        id: 'ts_web_01',
        start: 0,
        end: 479,
        timestampFormatted: '00:00',
        title: 'Client-Server Architecture',
        text: 'Modern web systems decouple client presentations from backend server logic. The client manages UI state and sends asynchronous HTTP requests, while the server executes business logic, database queries, and returns JSON payloads.',
      },
      {
        id: 'ts_web_02',
        start: 480,
        end: 1199,
        timestampFormatted: '08:00',
        title: 'REST Architecture and HTTP Methods',
        text: 'Representational State Transfer (REST) adheres to uniform interface contracts. GET retrieves resource representations, POST creates new resources idempotently, PUT/PATCH updates, and DELETE removes resources. Correct HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found) are strictly essential.',
      },
      {
        id: 'ts_web_03',
        start: 1200,
        end: 1799,
        timestampFormatted: '20:00',
        title: 'Authentication with JWT and Cookies',
        text: 'Stateless authentication relies on JSON Web Tokens (JWT) signed with a secure server secret key. The token payload contains user claims and expiration timestamp. When transmitted via HTTP-only secure cookies or Authorization Bearer headers, servers can verify identity without holding server-side session memory.',
      },
      {
        id: 'ts_web_04',
        start: 1800,
        end: 2400,
        timestampFormatted: '30:00',
        title: 'ACID Properties in Relational Databases',
        text: 'Relational databases guarantee ACID properties: Atomicity (all or nothing), Consistency (preserves integrity constraints), Isolation (concurrent operations do not interfere), and Durability (committed data survives server crashes).',
      },
    ],
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_ml_pdf',
    title: 'Machine Learning Engineering Handbook.pdf',
    type: 'pdf',
    sizeBytes: 2450000,
    uploadedAt: '2026-10-15T14:30:00Z',
    pageCount: 5,
    summary: 'A definitive reference covering loss functions, gradient descent, bias-variance trade-off, and metric evaluation.',
    chunks: [
      {
        id: 'chk_ml_1',
        documentId: 'doc_ml_pdf',
        pageOrSlideNumber: 1,
        type: 'page',
        title: 'Page 1: Fundamentals & Supervised Learning Formulations',
        content: 'Supervised learning formalizes the task of learning an approximation function f: X -> Y. For linear regression, we minimize Mean Squared Error cost J(w,b) = (1/2m) * sum((f(x_i) - y_i)^2). Gradient descent updates weights in the negative gradient direction: w := w - alpha * (dJ/dw).',
      },
      {
        id: 'chk_ml_2',
        documentId: 'doc_ml_pdf',
        pageOrSlideNumber: 2,
        type: 'page',
        title: 'Page 2: Classification, Logistic Regression & Cross-Entropy',
        content: 'For binary classification, linear outputs are passed through the sigmoid activation function sigma(z) = 1 / (1 + exp(-z)), constraining predictions between 0 and 1. We optimize the binary cross-entropy loss function L(y, y_hat) = -[y*log(y_hat) + (1-y)*log(1-y_hat)].',
      },
      {
        id: 'chk_ml_3',
        documentId: 'doc_ml_pdf',
        pageOrSlideNumber: 3,
        type: 'page',
        title: 'Page 3: Evaluation Metrics (Precision, Recall, ROC-AUC)',
        content: 'Accuracy alone is deceptive in imbalanced datasets. Precision = TP / (TP + FP) measures exactness. Recall (Sensitivity) = TP / (TP + FN) measures completeness. The harmonic mean F1 = 2 * (Precision * Recall) / (Precision + Recall) penalizes extreme imbalances. ROC-AUC evaluates true positive rate vs false positive rate across all discrimination thresholds.',
      },
      {
        id: 'chk_ml_4',
        documentId: 'doc_ml_pdf',
        pageOrSlideNumber: 4,
        type: 'page',
        title: 'Page 4: Bias-Variance Decomposition & Regularization',
        content: 'Total generalization error decomposes into: Bias^2 + Variance + Irreducible Noise. High bias indicates underfitting (model cannot capture complexity). High variance indicates overfitting (model fits training noise). Ridge regression adds L2 penalty lambda * sum(w_j^2) shrinking weights continuously. Lasso regression adds L1 penalty lambda * sum(|w_j|) driving parameters exactly to zero for feature selection.',
      },
      {
        id: 'chk_ml_5',
        documentId: 'doc_ml_pdf',
        pageOrSlideNumber: 5,
        type: 'page',
        title: 'Page 5: Unsupervised Clustering & Vector Embeddings',
        content: 'K-Means partitions n observations into k clusters minimizing inertia (within-cluster sum of squares). The algorithm alternates between assigning points to nearest centroids and recalculating centroids until convergence. Principal Component Analysis (PCA) finds orthogonal eigenvectors of the covariance matrix maximizing variance along primary projection axes.',
      },
    ],
  },
  {
    id: 'doc_dl_pptx',
    title: 'Deep Learning & Neural Architectures.pptx',
    type: 'pptx',
    sizeBytes: 4200000,
    uploadedAt: '2026-10-18T10:15:00Z',
    pageCount: 4,
    summary: 'Slide presentation detailing feedforward networks, backpropagation, and CNN architectures.',
    chunks: [
      {
        id: 'chk_dl_1',
        documentId: 'doc_dl_pptx',
        pageOrSlideNumber: 1,
        type: 'slide',
        title: 'Slide 1: Artificial Neurons & Multi-Layer Perceptrons',
        content: 'A biological neuron inspired perceptron computes weighted dot product z = w^T * x + b, passed into an activation function. Non-linear activation functions (ReLU, Leaky ReLU, GELU) allow deep networks to approximate arbitrary continuous functions by overcoming XOR limitations.',
      },
      {
        id: 'chk_dl_2',
        documentId: 'doc_dl_pptx',
        pageOrSlideNumber: 2,
        type: 'slide',
        title: 'Slide 2: Backpropagation & Matrix Calculus',
        content: 'Backpropagation leverages the chain rule of calculus to compute partial derivatives of loss with respect to every weight layer from output to input: dL/dw_l = (dL/da_l) * (da_l/dz_l) * (dz_l/dw_l). Modern frameworks (PyTorch, TensorFlow) use reverse-mode automatic differentiation DAG graphs.',
      },
      {
        id: 'chk_dl_3',
        documentId: 'doc_dl_pptx',
        pageOrSlideNumber: 3,
        type: 'slide',
        title: 'Slide 3: Vanishing Gradients & Modern Optimizers',
        content: 'Sigmoid activations saturate at extreme values causing gradients to vanish in deep networks. ReLU (max(0, x)) resolves positive saturation. Adam (Adaptive Moment Estimation) optimizer combines momentum (first moment of gradients) and RMSProp (second moment of squared gradients) for efficient parameter updates.',
      },
      {
        id: 'chk_dl_4',
        documentId: 'doc_dl_pptx',
        pageOrSlideNumber: 4,
        type: 'slide',
        title: 'Slide 4: Convolutional Neural Networks (CNNs)',
        content: 'Convolutional layers exploit spatial locality and translation equivariance using parameter-shared 2D kernel filters. Stride, padding, and max-pooling reduce spatial dimensions while building hierarchical feature representations from edges to complex semantic objects.',
      },
    ],
  },
  {
    id: 'doc_notes_txt',
    title: 'Study Notes - Systems & Algorithmic Complexity.txt',
    type: 'notes',
    sizeBytes: 15400,
    uploadedAt: '2026-10-24T16:45:00Z',
    pageCount: 2,
    summary: 'Personal handwritten revision notes on asymptotic analysis, concurrency, and caching architectures.',
    chunks: [
      {
        id: 'chk_notes_1',
        documentId: 'doc_notes_txt',
        pageOrSlideNumber: 1,
        type: 'section',
        title: 'Section 1: Space-Time Complexity Cheat Sheet',
        content: 'Always check constraints! Arrays: O(1) random index access, O(n) insert/delete. Hash Map: O(1) average lookup/insert, O(n) worst-case collision. Binary Search Tree: O(log n) balanced, O(n) degenerate. Heap/Priority Queue: O(1) peek, O(log n) push/pop. QuickSort: O(n log n) average, O(n^2) worst. MergeSort: Guaranteed O(n log n) with O(n) space.',
      },
      {
        id: 'chk_notes_2',
        documentId: 'doc_notes_txt',
        pageOrSlideNumber: 2,
        type: 'section',
        title: 'Section 2: Caching & Distributed Systems Fundamentals',
        content: 'Cache invalidation is notoriously challenging. Strategies include Write-Through (writes directly to cache and DB simultaneously), Write-Back (writes to cache immediately, asynchronously flushes to DB), and Cache-Aside (application checks cache; on miss reads DB and updates cache). Eviction policies: LRU (Least Recently Used) via Doubly Linked List + Hash Map.',
      },
    ],
  },
];

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob_two_sum',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    inputFormat: 'nums = [2,7,11,15], target = 9',
    outputFormat: '[0,1]',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      python: `def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
  // Write your solution here
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
      java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int comp = target - nums[i];
            if (seen.find(comp) != seen.end()) {
                return {seen[comp], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    },
    testCases: [
      { input: '[2,7,11,15], 9', expected: '[0,1]' },
      { input: '[3,2,4], 6', expected: '[1,2]' },
      { input: '[3,3], 6', expected: '[0,1]' },
      { input: '[-1,-2,-3,-4,-5], -8', expected: '[2,4]', hidden: true },
    ],
  },
  {
    id: 'prob_valid_parentheses',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    inputFormat: 's = "()[]{}"',
    outputFormat: 'true',
    examples: [
      {
        input: 's = "()"',
        output: 'true',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
      {
        input: 's = "(]"',
        output: 'false',
      },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}".',
    ],
    starterCode: {
      python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
`,
      javascript: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let char of s) {
    if (char in map) {
      if (stack.pop() !== map[char]) return false;
    } else {
      stack.push(char);
    }
  }
  return stack.length === 0;
}`,
      java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(') st.push(')');
            else if (c == '{') st.push('}');
            else if (c == '[') st.push(']');
            else {
                if (st.empty() || st.top() != c) return false;
                st.pop();
            }
        }
        return st.empty();
    }
};`,
    },
    testCases: [
      { input: '"()"', expected: 'true' },
      { input: '"()[]{}"', expected: 'true' },
      { input: '"(]"', expected: 'false' },
      { input: '"([)]"', expected: 'false' },
      { input: '"{[]}"', expected: 'true', hidden: true },
    ],
  },
  {
    id: 'prob_binary_search',
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    category: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    inputFormat: 'nums = [-1,0,3,5,9,12], target = 9',
    outputFormat: '4',
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists in nums and its index is 4',
      },
      {
        input: 'nums = [-1,0,3,5,9,12], target = 2',
        output: '-1',
        explanation: '2 does not exist in nums so return -1',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 < nums[i], target < 10^4',
      'All integers in nums are unique.',
      'nums is sorted in ascending order.',
    ],
    starterCode: {
      python: `def binary_search(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
`,
      javascript: `function binarySearch(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
      java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = nums.size() - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
};`,
    },
    testCases: [
      { input: '[-1,0,3,5,9,12], 9', expected: '4' },
      { input: '[-1,0,3,5,9,12], 2', expected: '-1' },
      { input: '[5], 5', expected: '0' },
      { input: '[1,3,5,7,9], 1', expected: '0', hidden: true },
    ],
  },
];

export const INTERVIEW_DOMAINS = [
  'Machine Learning',
  'Full Stack Development',
  'Data Structures and Algorithms',
  'React',
  'Node.js',
  'JavaScript',
  'Java',
  'DBMS',
];

export const INTERVIEW_QUESTIONS: Record<string, InterviewQuestion[]> = {
  'Machine Learning': [
    {
      id: 'ml_int_1',
      domain: 'Machine Learning',
      difficulty: 'Medium',
      question: 'Explain the bias-variance tradeoff and how you diagnose whether a machine learning model is suffering from high bias or high variance.',
      hints: [
        'Mention training vs validation error gap',
        'Relate high bias to underfitting and high variance to overfitting',
        'Propose concrete remediation strategies like regularization or data augmentation',
      ],
      idealKeyPoints: [
        'Total generalization error decomposes into Bias^2 + Variance + Irreducible error',
        'High bias = underfitting, poor performance on both train and validation sets',
        'High variance = overfitting, exceptional train performance but significant generalization gap',
        'Diagnostic: Learning curves plotting error over dataset size',
        'Solutions for high variance: Regularization (L1/L2), dropout, more data, feature selection',
        'Solutions for high bias: Increase model capacity, add polynomial features, reduce regularization',
      ],
    },
    {
      id: 'ml_int_2',
      domain: 'Machine Learning',
      difficulty: 'Hard',
      question: 'Why is accuracy often an unsuitable metric for medical diagnosis or fraud detection datasets, and what alternative metrics would you evaluate?',
      hints: [
        'Think about severe class imbalance (e.g. 99.9% negative)',
        'Define Precision, Recall, and F1-Score',
        'Explain the business cost of False Negatives vs False Positives',
      ],
      idealKeyPoints: [
        'Accuracy paradox: predicting majority class yields 99.9% accuracy while missing all critical cases',
        'Recall (Sensitivity) is paramount when False Negatives are costly (missing a disease or fraud)',
        'Precision prevents false alarm fatigue',
        'F1-score or PR-AUC gives balanced assessment on rare positive classes',
        'Confusion matrix examination and Cost-sensitive matrix weighting',
      ],
    },
  ],
  'Full Stack Development': [
    {
      id: 'fs_int_1',
      domain: 'Full Stack Development',
      difficulty: 'Medium',
      question: 'How do you design a scalable authentication system using JWTs, and what are the primary security considerations regarding token storage?',
      hints: [
        'Explain Access Tokens vs Refresh Tokens',
        'Contrast localStorage with HttpOnly SameSite cookies',
        'Address Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)',
      ],
      idealKeyPoints: [
        'Short-lived Access Token (15 mins) paired with rotating Refresh Token (7 days)',
        'Storage in HttpOnly, Secure, SameSite=Strict/Lax cookies shields tokens from client XSS',
        'Storing tokens in localStorage leaves them vulnerable to malicious third-party script injection',
        'CSRF mitigation via SameSite flag and anti-CSRF token verification',
        'Token revocation strategy: database blacklist or token family generation counters',
      ],
    },
  ],
  'React': [
    {
      id: 'react_int_1',
      domain: 'React',
      difficulty: 'Medium',
      question: 'How does the Virtual DOM reconciliation algorithm work in React, and why is the "key" prop critical when rendering dynamic lists?',
      hints: [
        'Discuss diffing heuristic O(n^3) reduced to O(n)',
        'Explain what happens if array index is used as key during item reordering',
      ],
      idealKeyPoints: [
        'Fiber tree representation of UI and double-buffering workInProgress tree',
        'Heuristic diffing compares elements of different types by dismantling old subtrees',
        'Key prop provides stable identity across render cycles',
        'Index as key triggers state mismatch bugs when items are inserted, deleted, or sorted',
      ],
    },
  ],
  'JavaScript': [
    {
      id: 'js_int_1',
      domain: 'JavaScript',
      difficulty: 'Medium',
      question: 'Explain the JavaScript Event Loop, Call Stack, Microtask queue, and Macrotask queue with an execution order example.',
      hints: [
        'Promise callbacks vs setTimeout',
        'Microtasks run to completion after current execution frame before next macrotask',
      ],
      idealKeyPoints: [
        'Single-threaded execution with synchronous Call Stack',
        'Microtask queue: Promises (.then/.catch), queueMicrotask, MutationObserver',
        'Macrotask queue: setTimeout, setInterval, I/O, requestAnimationFrame',
        'Event loop drains all pending microtasks before executing the next macrotask',
      ],
    },
  ],
  'Node.js': [
    {
      id: 'node_int_1',
      domain: 'Node.js',
      difficulty: 'Medium',
      question: 'How does Node.js achieve high concurrency despite being single-threaded, and how would you handle heavy CPU-bound tasks?',
      hints: [
        'Mention libuv thread pool and non-blocking asynchronous I/O',
        'Worker threads and clustering',
      ],
      idealKeyPoints: [
        'Single JS execution thread backed by libuv non-blocking event loop',
        'libuv thread pool handles blocking operations (file system, crypto, DNS lookup)',
        'CPU-heavy tasks block the event loop, causing severe latency spikes',
        'Remediation: Worker Threads (worker_threads module), child processes, or microservice delegation',
      ],
    },
  ],
  'DBMS': [
    {
      id: 'db_int_1',
      domain: 'DBMS',
      difficulty: 'Medium',
      question: 'Explain ACID properties in relational databases and describe how B-Tree indexes accelerate SELECT queries.',
      hints: [
        'Atomicity, Consistency, Isolation, Durability',
        'Balanced multi-way search tree with O(log n) lookup',
      ],
      idealKeyPoints: [
        'Atomicity: Transaction completes wholly or rolls back completely (WAL logs)',
        'Consistency: Preserves foreign key, unique, check constraints',
        'Isolation: Controls concurrent visibility (Read Committed, Repeatable Read, Serializable via MVCC)',
        'Durability: Committed writes survive power failure via non-volatile storage flushing',
        'B-Trees maintain sorted balance, reducing disk page I/O reads to O(log_B n)',
      ],
    },
  ],
  'Data Structures and Algorithms': [
    {
      id: 'dsa_int_1',
      domain: 'Data Structures and Algorithms',
      difficulty: 'Hard',
      question: 'Describe Dijkstra’s shortest path algorithm versus the Bellman-Ford algorithm, including time complexities and negative weight cycles.',
      hints: [
        'Greedy vs Dynamic Programming approaches',
        'Priority Queue min-heap optimization for Dijkstra',
      ],
      idealKeyPoints: [
        'Dijkstra is greedy, works on non-negative edge weights, runs in O((V + E) log V) with min-heap',
        'Fails on negative edge weights because greedy assumptions are invalidated',
        'Bellman-Ford relaxes all E edges V-1 times, running in O(V * E)',
        'Bellman-Ford reliably detects negative weight cycles if distance reduces on V-th iteration',
      ],
    },
  ],
  'Java': [
    {
      id: 'java_int_1',
      domain: 'Java',
      difficulty: 'Medium',
      question: 'Explain the internal memory model in Java (Heap vs Stack) and how Garbage Collection generational hypothesis works.',
      hints: [
        'Young generation (Eden, Survivor spaces) vs Old generation',
        'Minor GC vs Major GC',
      ],
      idealKeyPoints: [
        'Stack stores thread-specific call frames, primitive values, and object references',
        'Heap stores all allocated objects shared across threads',
        'Weak generational hypothesis: Most created objects die young',
        'Young gen divided into Eden and Survivor (S0/S1); surviving objects age into Old/Tenured gen',
        'Modern collectors: G1GC, ZGC minimize stop-the-world pause times',
      ],
    },
  ],
};

export const INITIAL_ANALYTICS: LearningAnalytics = {
  totalHours: 38.5,
  completedVideos: 14,
  quizzesAttempted: 22,
  averageQuizScore: 86.4,
  codeProblemsSolved: 48,
  interviewSessionsCompleted: 9,
  weeklyActivity: [
    { day: 'Mon', minutes: 75 },
    { day: 'Tue', minutes: 110 },
    { day: 'Wed', minutes: 45 },
    { day: 'Thu', minutes: 90 },
    { day: 'Fri', minutes: 130 },
    { day: 'Sat', minutes: 180 },
    { day: 'Sun', minutes: 60 },
  ],
  weakTopics: [
    { topic: 'Dynamic Programming (Knapsack)', score: 58 },
    { topic: 'Regularization & High Variance', score: 64 },
    { topic: 'Database Isolation Levels (MVCC)', score: 71 },
  ],
  strongTopics: [
    { topic: 'Supervised Learning & Regression', score: 96 },
    { topic: 'Binary Search & Pointers', score: 94 },
    { topic: 'RESTful API & JWT Security', score: 92 },
    { topic: 'Stack & Queue Fundamentals', score: 89 },
  ],
  recentLessons: [
    {
      videoId: 'vid_ml_01',
      title: 'Machine Learning Foundations: Supervised, Unsupervised & Evaluation',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600',
      progressPercentage: 45,
      lastWatchedTimestamp: '18:42',
    },
    {
      videoId: 'vid_dsa_02',
      title: 'Data Structures & Algorithms: Binary Search to Graph Traversal',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516116211227-bbc675b839aa?auto=format&fit=crop&q=80&w=600',
      progressPercentage: 80,
      lastWatchedTimestamp: '24:00',
    },
    {
      videoId: 'vid_web_03',
      title: 'Modern Full-Stack Engineering: RESTful APIs, Auth & Microservices',
      thumbnailUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?auto=format&fit=crop&q=80&w=600',
      progressPercentage: 100,
      lastWatchedTimestamp: '40:00',
    },
  ],
};
