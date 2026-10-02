import { Question, PartType } from "./types";

export const SAMPLE_QUESTIONS: Question[] = [
  // Part 1
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `p1-${i + 1}`,
    part: PartType.PART1,
    question: `Câu hỏi trắc nghiệm Part 1 số ${i + 1}: Thủ đô của Việt Nam là gì?`,
    A: "Hà Nội",
    B: "Huế",
    C: "Đà Nẵng",
    D: "TP. Hồ Chí Minh",
    answer: "A",
  })),
  // Part 2
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `p2-${i + 1}`,
    part: PartType.PART2,
    question: `Câu hỏi Đúng/Sai Part 2 số ${i + 1}: Xét các mệnh đề sau về địa lý Việt Nam.`,
    statements: {
      a: "Việt Nam nằm ở Đông Nam Á.",
      b: "Việt Nam có đường bờ biển dài hơn 3000km.",
      c: "Đỉnh Phan-xi-păng là đỉnh núi cao nhất Việt Nam.",
      d: "Việt Nam có 64 tỉnh thành.",
    },
    answer: { a: true, b: true, c: true, d: false },
  })),
  // Part 3
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `p3-${i + 1}`,
    part: PartType.PART3,
    question: `Câu hỏi trả lời ngắn Part 3 số ${i + 1}: Tính giá trị của 20 + 25.`,
    answer: "45",
  })),
];
