// Arduino.h for CPE Online: the Arduino functions a sketch uses, running on
// a virtual Arduino Uno, or a virtual ESP32 DevKit when CPE_BOARD_ESP32 is
// defined (the ESP32 part is at the end). Pins, time and servos live in the page (see
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
CPE_IMPORT(pulse_in) double cpe_pulse_in(int pin, int state, double timeoutMicros);
#ifdef CPE_BOARD_ESP32
CPE_IMPORT(ledc_attach) int cpe_ledc_attach(int pin, int frequency, int bits);
CPE_IMPORT(ledc_write) int cpe_ledc_write(int pin, int duty);
CPE_IMPORT(analog_resolution) void cpe_analog_resolution(int bits);
CPE_IMPORT(touch_read) int cpe_touch_read(int pin);
CPE_IMPORT(dac_write) void cpe_dac_write(int pin, int value);
CPE_IMPORT(deep_sleep) void cpe_deep_sleep(int rtcStart, int rtcLength);
CPE_IMPORT(sleep_timer) void cpe_sleep_timer(double ms);
CPE_IMPORT(wake_cause) int cpe_wake_cause();
CPE_IMPORT(rtc_restore) void cpe_rtc_restore(int rtcStart, int rtcLength);
#endif
}

typedef bool boolean;
typedef uint8_t byte;
typedef unsigned int word;

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
#ifdef CPE_BOARD_ESP32
// ESP32 DevKit: the blue LED is on GPIO 2; the A names follow the ESP32 core.
#define LED_BUILTIN 2
#define A0 36
#define A3 39
#define A4 32
#define A5 33
#define A6 34
#define A7 35
#else
#define LED_BUILTIN 13
#define A0 14
#define A1 15
#define A2 16
#define A3 17
#define A4 18
#define A5 19
#endif

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

#ifdef CPE_BOARD_ESP32
// ESP32 extras, as in the Arduino-ESP32 core (version 3): LEDC PWM on any
// output pin, analogRead resolution, touch pins, the DAC and deep sleep.
inline bool ledcAttach(uint8_t pin, uint32_t frequency, uint8_t resolutionBits) { return cpe_ledc_attach(pin, (int)frequency, resolutionBits) != 0; }
inline bool ledcWrite(uint8_t pin, uint32_t duty) { return cpe_ledc_write(pin, (int)duty) != 0; }
inline void analogReadResolution(uint8_t bits) { cpe_analog_resolution(bits); }
inline uint16_t touchRead(uint8_t pin) { return (uint16_t)cpe_touch_read(pin); }
inline void dacWrite(uint8_t pin, uint8_t value) { cpe_dac_write(pin, value); }
// Deep sleep. RAM is lost while asleep and the board starts again from
// setup() when it wakes; variables marked RTC_DATA_ATTR live in a memory
// section of their own, which the board keeps and puts back at start-up.
#define RTC_DATA_ATTR __attribute__((section("rtc_data"), used))
extern "C" char __start_rtc_data[] __attribute__((weak));
extern "C" char __stop_rtc_data[] __attribute__((weak));
inline int cpe_rtc_start() { return (int)(intptr_t)__start_rtc_data; }
inline int cpe_rtc_length() { return __start_rtc_data ? (int)(__stop_rtc_data - __start_rtc_data) : 0; }

typedef enum {
  ESP_SLEEP_WAKEUP_UNDEFINED = 0,
  ESP_SLEEP_WAKEUP_EXT0 = 2,
  ESP_SLEEP_WAKEUP_EXT1 = 3,
  ESP_SLEEP_WAKEUP_TIMER = 4,
  ESP_SLEEP_WAKEUP_TOUCHPAD = 5,
} esp_sleep_wakeup_cause_t;

inline void esp_sleep_enable_timer_wakeup(uint64_t microseconds) { cpe_sleep_timer(microseconds / 1000.0); }
inline esp_sleep_wakeup_cause_t esp_sleep_get_wakeup_cause() { return (esp_sleep_wakeup_cause_t)cpe_wake_cause(); }
inline void esp_deep_sleep_start() {
  fflush(stdout);
  cpe_deep_sleep(cpe_rtc_start(), cpe_rtc_length());
}
#endif
inline void tone(int pin, unsigned int frequency, unsigned long duration = 0) { cpe_tone(pin, (int)frequency, (int)duration); }
inline void noTone(int pin) { cpe_tone(pin, 0, 0); }

// Each of these moves the clock and can end the run, so Serial text printed
// so far is sent first, as a real board would already have sent it.
inline unsigned long millis() { fflush(stdout); return (unsigned long)cpe_millis(); }
inline unsigned long micros() { fflush(stdout); return (unsigned long)(cpe_millis() * 1000.0); }
inline void delay(unsigned long ms) { fflush(stdout); cpe_delay((double)ms); }
inline void delayMicroseconds(unsigned int us) { fflush(stdout); cpe_delay(us / 1000.0); }
// How long a pin stays at `state`, in microseconds (0 after `timeout`). The
// board answers for an ultrasonic sensor's Echo pin from the distance it is given.
inline unsigned long pulseIn(uint8_t pin, uint8_t state, unsigned long timeout = 1000000UL) {
  fflush(stdout);
  return (unsigned long)cpe_pulse_in(pin, state, (double)timeout);
}

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
#ifdef CPE_BOARD_ESP32
  // After a wake-up from deep sleep, the RTC variables get their values back.
  cpe_rtc_restore(cpe_rtc_start(), cpe_rtc_length());
#endif
  setup();
  for (;;) {
    loop();
    fflush(stdout);
    cpe_loop_end();
  }
}

#endif
