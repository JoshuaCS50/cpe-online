// A 128 x 64 SSD1306 OLED screen for CPE Online, with the text calls of the
// Adafruit_SSD1306 library that lessons use. Text sits on a grid of 21 x 8
// characters (6 x 8 pixels each; size 2 takes 2 x 2 cells). display() sends
// the grid to the virtual board, which records what the screen shows.
// Drawing shapes is accepted and ignored.

#ifndef CPE_ADAFRUIT_SSD1306_H
#define CPE_ADAFRUIT_SSD1306_H

#include "Arduino.h"
#include "Wire.h"

#define SSD1306_SWITCHCAPVCC 0x02
#define SSD1306_EXTERNALVCC 0x01
#define SSD1306_WHITE 1
#define SSD1306_BLACK 0
#define SSD1306_INVERSE 2
#define WHITE 1
#define BLACK 0

extern "C" {
CPE_IMPORT(screen_show) void cpe_screen_show(const char *text, int length);
}

class Adafruit_SSD1306 {
public:
  static const int COLS = 21;
  static const int ROWS = 8;

  Adafruit_SSD1306(int width = 128, int height = 64, TwoWire * = &Wire, int = -1) : w(width), h(height) { clearDisplay(); }
  bool begin(int = SSD1306_SWITCHCAPVCC, int = 0x3C, bool = true, bool = true) { return true; }
  void clearDisplay() {
    memset(grid, ' ', sizeof(grid));
    memset(scale, 1, sizeof(scale));
    col = 0;
    row = 0;
  }
  void setTextSize(int size) { textSize = size < 1 ? 1 : size > 2 ? 2 : size; }
  void setTextColor(int, int = 0) {}
  void setTextWrap(bool) {}
  void setCursor(int x, int y) {
    col = x / 6;
    row = y / 8;
  }
  int width() const { return w; }
  int height() const { return h; }
  void drawPixel(int, int, int) {}
  void drawLine(int, int, int, int, int) {}
  void drawRect(int, int, int, int, int) {}
  void fillRect(int, int, int, int, int) {}
  void drawCircle(int, int, int, int) {}
  void fillCircle(int, int, int, int) {}
  void invertDisplay(bool) {}
  void dim(bool) {}

  size_t write(char c) {
    if (c == '\n') {
      row += textSize;
      col = 0;
      return 1;
    }
    if (c == '\r') return 1;
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      grid[row][col] = c;
      scale[row][col] = (char)textSize;
      // A big character covers the cells to its right and below.
      if (textSize == 2) {
        if (col + 1 < COLS) grid[row][col + 1] = '\x01';
        if (row + 1 < ROWS) {
          grid[row + 1][col] = '\x01';
          if (col + 1 < COLS) grid[row + 1][col + 1] = '\x01';
        }
      }
    }
    col += textSize;
    if (col >= COLS) {
      col = 0;
      row += textSize;
    }
    return 1;
  }
  size_t print(const char *text) {
    size_t n = 0;
    while (*text) n += write(*text++);
    return n;
  }
  size_t print(const String &text) { return print(text.c_str()); }
  size_t print(char c) { return write(c); }
  size_t print(int value) { return print((long)value); }
  size_t print(unsigned int value) { return print((unsigned long)value); }
  size_t print(long value) {
    char buffer[24];
    snprintf(buffer, sizeof(buffer), "%ld", value);
    return print(buffer);
  }
  size_t print(unsigned long value) {
    char buffer[24];
    snprintf(buffer, sizeof(buffer), "%lu", value);
    return print(buffer);
  }
  size_t print(double value, int decimals = 2) {
    char buffer[40];
    snprintf(buffer, sizeof(buffer), "%.*f", decimals, value);
    return print(buffer);
  }
  size_t println() { return write('\n'); }
  template <typename T> size_t println(const T &value) { size_t n = print(value); return n + write('\n'); }
  template <typename T> size_t println(const T &value, int digits) { size_t n = print(value, digits); return n + write('\n'); }

  /** Sends the screen to the board: one line per text row, each starting with its size (1 or 2). */
  void display() {
    char out[ROWS * (COLS + 2) + 1];
    int n = 0;
    for (int r = 0; r < ROWS; r++) {
      int last = -1;
      char size = '1';
      for (int c = 0; c < COLS; c++) {
        char ch = grid[r][c];
        if (ch != ' ' && ch != '\x01') {
          last = c;
          if (scale[r][c] == 2) size = '2';
        }
      }
      if (last < 0) continue;
      out[n++] = size;
      for (int c = 0; c <= last; c++) {
        char ch = grid[r][c];
        if (ch != '\x01') out[n++] = ch;
      }
      out[n++] = '\n';
    }
    cpe_screen_show(out, n);
  }

private:
  int w;
  int h;
  int col = 0;
  int row = 0;
  int textSize = 1;
  char grid[ROWS][COLS];
  char scale[ROWS][COLS];
};

#endif
