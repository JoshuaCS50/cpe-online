#include <stdio.h>

int square(int x) {
    int y = x * x;
    return y;
}

int main() {
    int a = 3;
    int total = 0;
    int i;
    for (i = 0; i < 2; i++) {
        total = total + square(a + i);
    }
    printf("%d\n", total);
    return 0;
}
