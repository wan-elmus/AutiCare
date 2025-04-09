#include <Arduino.h>
#include "lcd.h"
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C LCDdisplay(0x27,16,2);

void LCD(int8 column, int8 row, String message){
    LCDdisplay.setCursor(column,row);
    LCDdisplay.print(message);
}

void setupLCD(){
    LCDdisplay.init();
    LCDdisplay.backlight();
    LCD(0,0, "Auticare");
}

void smiley(){
    // Custom character for the smiley face (8 bytes)
    byte smiley[8] = {
        B00000,
        B10001,
        B00000,
        B00000,
        B10001,
        B01110,
        B00000,
        B00000
    };
    LCDdisplay.createChar(0, smiley); 
    LCDdisplay.setCursor(9, 0); // Set cursor to the beginning of the first line
    LCDdisplay.write(byte(0)); // Write the custom character (smiley face)
    LCDdisplay.setCursor(10,0);
    LCDdisplay.write(byte(0));
    LCDdisplay.setCursor(11,0);
    LCDdisplay.write(byte(0));
}