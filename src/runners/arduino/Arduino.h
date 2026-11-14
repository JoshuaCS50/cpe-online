// Arduino.h for CPE Online: the Arduino functions a sketch uses, running on
// a virtual Arduino Uno. Pins, time and servos live in the page (see
// src/runners/arduino/board.ts); this file reaches them through a handful of
// imported functions. Serial output is printed to the terminal.
//
// Time is virtual: delay() moves the board's clock forward at once, so a
// sketch that runs for ten seconds of board time finishes in a moment. The
// board ends the program when its run time is used up.

#ifndef CPE_ARDUINO_H
#define CPE_ARDUINO_H

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>

#define CPE_IMPORT(name) __attribute__((import_module("arduino"), import_name(#name)))

extern "C" {
CPE_IMPORT(pin_mode) void cpe_pin_mode(int pin, int mode);
CPE_IMPORT(digital_write) void cpe_digital_write(int pin, int value);
CPE_IMPORT(digital_read) int cpe_digital_read(int pin);
CPE_IMPORT(analog_read) int cpe_analog_read(int pin);
CPE_IMPORT(analog_write) void cpe_analog_write(int pin, int value);
CPE_IMPORT(servo_write) void cpe_servo_write(int pin, int angle);
CPE_IMPORT(tone) void cpe_tone(int pin, int frequency, int durationMs);
CPE_IMPORT(millis) double cpe_millis();
CPE_IMPORT(delay) void cpe_delay(double ms);
CPE_IMPORT(loop_end) void cpe_loop_end();
CPE_IMPORT(serial_begin) void cpe_serial_begin(int baud);
CPE_IMPORT(serial_used) void cpe_serial_used();
}

typedef bool boolean;
typedef uint8_t byte;
typedef unsigned int word;

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#define LED_BUILTIN 13

#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A4 18
#define A5 19

#define DEC 10
#define HEX 16
#define OCT 8
#define BIN 2

#ifndef PI
#define PI 3.14159265358979323846
#endif

inline void pinMode(int pin, int mode) { cpe_pin_mode(pin, mode); }
inline void digitalWrite(int pin, int value) { cpe_digital_write(pin, value ? HIGH : LOW); }
inline int digitalRead(int pin) { return cpe_digital_read(pin); }
inline int analogRead(int pin) { return cpe_analog_read(pin); }
inline void analogWrite(int pin, int value) { cpe_analog_write(pin, value < 0 ? 0 : value > 255 ? 255 : value); }
inline void tone(int pin, unsigned int frequency, unsigned long duration = 0) { cpe_tone(pin, (int)frequency, (int)duration); }
inline void noTone(int pin) { cpe_tone(pin, 0, 0); }

inline unsigned long millis() { return (unsigned long)cpe_millis(); }
inline unsigned long micros() { return (unsigned long)(cpe_millis() * 1000.0); }
inline void delay(unsigned long ms) { cpe_delay((double)ms); }
inline void delayMicroseconds(unsigned int us) { cpe_delay(us / 1000.0); }

template <typename T> inline T constrain(T value, T low, T high) { return value < low ? low : value > high ? high : value; }
inline long constrain(long value, long low, long high) { return value < low ? low : value > high ? high : value; }
inline long map(long value, long fromLow, long fromHigh, long toLow, long toHigh) {
  return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
}
// Functions, not the macros of the real core, so standard headers still work.
template <typename A, typename B> inline auto min(A a, B b) -> decltype(a < b ? a : b) { return a < b ? a : b; }
template <typename A, typename B> inline auto max(A a, B b) -> decltype(a > b ? a : b) { return a > b ? a : b; }
inline long sq(long x) { return x * x; }

inline void randomSeed(unsigned long seed) { srand((unsigned int)seed); }
inline long random(long howBig) { return howBig <= 0 ? 0 : rand() % howBig; }
inline long random(long howSmall, long howBig) { return howBig <= howSmall ? howSmall : howSmall + rand() % (howBig - howSmall); }

// A small String class with the parts of Arduino's String that lessons use.
class String {
public:
  String() {}
  String(const char *text) : s(text ? text : "") {}
  String(const std::string &text) : s(text) {}
  String(char c) : s(1, c) {}
  String(int value) : s(std::to_string(value)) {}
  String(unsigned int value) : s(std::to_string(value)) {}
  String(long value) : s(std::to_string(value)) {}
  String(unsigned long value) : s(std::to_string(value)) {}
  String(double value, int decimals = 2) {
    char buffer[64];
    snprintf(buffer, sizeof(buffer), "%.*f", decimals, value);
    s = buffer;
  }
  unsigned int length() const { return (unsigned int)s.size(); }
  const char *c_str() const { return s.c_str(); }
  char charAt(unsigned int i) const { return i < s.size() ? s[i] : 0; }
  char operator[](unsigned int i) const { return charAt(i); }
  int indexOf(char c) const { size_t p = s.find(c); return p == std::string::npos ? -1 : (int)p; }
  int indexOf(const String &text) const { size_t p = s.find(text.s); return p == std::string::npos ? -1 : (int)p; }
  String substring(unsigned int from) const { return from >= s.size() ? String() : String(s.substr(from)); }
  String substring(unsigned int from, unsigned int to) const { return from >= s.size() || to <= from ? String() : String(s.substr(from, to - from)); }
  long toInt() const { return atol(s.c_str()); }
  double toFloat() const { return atof(s.c_str()); }
  void toUpperCase() { for (char &c : s) if (c >= 'a' && c <= 'z') c = (char)(c - 32); }
  void toLowerCase() { for (char &c : s) if (c >= 'A' && c <= 'Z') c = (char)(c + 32); }
  void trim() {
    size_t a = s.find_first_not_of(" \t\r\n");
    size_t b = s.find_last_not_of(" \t\r\n");
    s = a == std::string::npos ? "" : s.substr(a, b - a + 1);
  }
  String &operator+=(const String &other) { s += other.s; return *this; }
  bool operator==(const String &other) const { return s == other.s; }
  bool operator!=(const String &other) const { return s != other.s; }
  bool equals(const String &other) const { return s == other.s; }
  friend String operator+(const String &a, const String &b) { return String(a.s + b.s); }
private:
  std::string s;
};

// Serial: printing goes to the terminal, as the Serial Monitor would show it.
class SerialPort {
public:
  void begin(long baud) { cpe_serial_begin((int)baud); }
  void end() {}
  int available() { return 0; }
  int read() { return -1; }
  void flush() { fflush(stdout); }
  operator bool() const { return true; }

  size_t print(const char *text) { cpe_serial_used(); return (size_t)printf("%s", text); }
  size_t print(const String &text) { return print(text.c_str()); }
  size_t print(char c) { cpe_serial_used(); return (size_t)printf("%c", c); }
  size_t print(int value, int base = DEC) { return print((long)value, base); }
  size_t print(unsigned int value, int base = DEC) { return print((unsigned long)value, base); }
  size_t print(long value, int base = DEC) {
    if (base == DEC) { cpe_serial_used(); return (size_t)printf("%ld", value); }
    return print((unsigned long)value, base);
  }
  size_t print(unsigned long value, int base = DEC) {
    cpe_serial_used();
    if (base == DEC) return (size_t)printf("%lu", value);
    if (base == HEX) return (size_t)printf("%lX", value);
    if (base == OCT) return (size_t)printf("%lo", value);
    char digits[65];
    int n = 0;
    do { digits[n++] = (char)('0' + (value & 1)); value >>= 1; } while (value && n < 64);
    for (int i = n - 1; i >= 0; i--) putchar(digits[i]);
    return (size_t)n;
  }
  size_t print(double value, int decimals = 2) { cpe_serial_used(); return (size_t)printf("%.*f", decimals, value); }

  size_t println() { return print("\n"); }
  template <typename T> size_t println(const T &value) { size_t n = print(value); return n + print("\n"); }
  template <typename T> size_t println(const T &value, int format) { size_t n = print(value, format); return n + print("\n"); }
};
inline SerialPort Serial;

// Servo: write() sets the angle, which the board records over time.
class Servo {
public:
  uint8_t attach(int pin) { attachedPin = pin; return 1; }
  uint8_t attach(int pin, int, int) { return attach(pin); }
  void detach() { attachedPin = -1; }
  bool attached() const { return attachedPin >= 0; }
  void write(int angle) {
    angleNow = angle < 0 ? 0 : angle > 180 ? 180 : angle;
    if (attachedPin >= 0) cpe_servo_write(attachedPin, angleNow);
  }
  int read() const { return angleNow; }
private:
  int attachedPin = -1;
  int angleNow = 90;
};

void setup();
void loop();

int main() {
  setup();
  for (;;) {
    loop();
    fflush(stdout);
    cpe_loop_end();
  }
}

#endif
