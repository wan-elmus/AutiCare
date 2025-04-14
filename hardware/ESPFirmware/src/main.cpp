#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include "defs.h"
#include "sensors.h"
#include "postman.h"
#include "oled.h"

void setup()
{
    Serial.begin(BAUD_RATE);
    setupOLED();
    setupWiFi();
    setupSensors();
    Serial.println(CSV_HEADER); 
}


void loop()
{
    SensorData data = readSensorsData();
    
    // printSensorData(data);
    printCSV(data);

    displayData(data);
    send(data);
}
