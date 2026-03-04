import { detectInputType, isChinese } from "@/lib/detect";

describe("detectInputType", () => {
  // --- Empty / whitespace ---
  describe("empty and whitespace inputs", () => {
    test("empty string returns text", () => {
      expect(detectInputType("")).toBe("text");
    });

    test("whitespace-only returns text", () => {
      expect(detectInputType("   ")).toBe("text");
      expect(detectInputType("\t\n")).toBe("text");
    });
  });

  // --- Single English words ---
  describe("single English words", () => {
    test("simple word", () => {
      expect(detectInputType("hello")).toBe("word");
      expect(detectInputType("Apple")).toBe("word");
      expect(detectInputType("I")).toBe("word");
    });

    test("hyphenated words", () => {
      expect(detectInputType("self-driving")).toBe("word");
      expect(detectInputType("well-known")).toBe("word");
      expect(detectInputType("mother-in-law")).toBe("word");
    });

    test("contractions", () => {
      expect(detectInputType("don't")).toBe("word");
      expect(detectInputType("I'm")).toBe("word");
      expect(detectInputType("won't")).toBe("word");
      expect(detectInputType("teacher's")).toBe("word");
      expect(detectInputType("it's")).toBe("word");
    });

    test("with leading/trailing spaces (trimmed)", () => {
      expect(detectInputType("  hello  ")).toBe("word");
      expect(detectInputType(" don't ")).toBe("word");
    });
  });

  // --- Single Chinese words ---
  describe("single Chinese words", () => {
    test("1 character", () => {
      expect(detectInputType("你")).toBe("word");
    });

    test("2 characters", () => {
      expect(detectInputType("你好")).toBe("word");
      expect(detectInputType("苹果")).toBe("word");
    });

    test("3 characters", () => {
      expect(detectInputType("翻译器")).toBe("word");
    });

    test("4 characters", () => {
      expect(detectInputType("人工智能")).toBe("word");
    });

    test("5+ characters → text mode", () => {
      expect(detectInputType("自然语言处理")).toBe("text");
    });

    test("Chinese with punctuation → text mode", () => {
      expect(detectInputType("你好！")).toBe("text");
      expect(detectInputType("你好。")).toBe("text");
    });

    test("Chinese with spaces → text mode", () => {
      expect(detectInputType("你 好")).toBe("text");
    });
  });

  // --- Text mode (multiple words, mixed, etc.) ---
  describe("text mode inputs", () => {
    test("multiple English words", () => {
      expect(detectInputType("hello world")).toBe("text");
      expect(detectInputType("good morning")).toBe("text");
    });

    test("English sentence", () => {
      expect(detectInputType("How are you?")).toBe("text");
    });

    test("Chinese sentence", () => {
      expect(detectInputType("今天天气不错")).toBe("text");
    });

    test("mixed Chinese-English", () => {
      expect(detectInputType("hello 你好")).toBe("text");
      expect(detectInputType("I love 苹果")).toBe("text");
    });

    test("numbers", () => {
      expect(detectInputType("123")).toBe("text");
      expect(detectInputType("hello123")).toBe("text");
    });

    test("special characters", () => {
      expect(detectInputType("hello!")).toBe("text");
      expect(detectInputType("@user")).toBe("text");
    });
  });
});

describe("isChinese", () => {
  test("Chinese word returns true", () => {
    expect(isChinese("你好")).toBe(true);
    expect(isChinese("人工智能")).toBe(true);
  });

  test("English word returns false", () => {
    expect(isChinese("hello")).toBe(false);
  });

  test("mixed returns false", () => {
    expect(isChinese("hello你好")).toBe(false);
  });

  test("5+ Chinese chars returns false", () => {
    expect(isChinese("自然语言处理")).toBe(false);
  });
});
