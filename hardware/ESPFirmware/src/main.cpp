#include <Arduino.h>
#include <SPI.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"

LiquidCrystal_I2C lcd(0x27,16,2);
WiFiClient client;
HTTPClient http;
MAX30105 pulseOximeter;

const char* ssid = "universe";
const char* password = "one2eight!";
const char* API_URL = "http://192.168.100.7:8000/sensor/data";

const byte RATE_SIZE = 4; //Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE]; //Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; //Time at which the last beat occurred 
float beatsPerMinute;
int beatAvg;


void LCD(int8 column, int8 row, String message){
    lcd.setCursor(column,row);
    lcd.print(message);
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
    lcd.createChar(0, smiley); 
    lcd.setCursor(9, 0); // Set cursor to the beginning of the first line
    lcd.write(byte(0)); // Write the custom character (smiley face)
    lcd.setCursor(10,0);
    lcd.write(byte(0));
    lcd.setCursor(11,0);
    lcd.write(byte(0));
}

void setupWiFi(){
    Serial.print("Connecting to ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    int count = 0;
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        LCD(9+count,0,".");
        count++;
        if(count==4){
            LCD(9,0,"*");LCD(10,0,"*");LCD(11,0,"*");
            count=0;
        }
    }
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    smiley();
}

void setupPulseSensor(){
    // Initialize sensor
    if (pulseOximeter.begin(Wire, I2C_SPEED_FAST) == false)
    {
        Serial.println("MAX30100 was not found. Please check wiring/power. ");
        while (1);
    }
    Serial.println("Place your index finger on the sensor with steady pressure.");
    pulseOximeter.setup(0);
    pulseOximeter.setPulseAmplitudeRed(0x0A); //Turn Red LED to low to indicate sensor is running
    pulseOximeter.setPulseAmplitudeGreen(0); //Turn off Green LED
}

int readPulse(){
    long irValue = pulseOximeter.getIR();

    if (checkForBeat(irValue) == true)
    {
        //We sensed a beat!
        long delta = millis() - lastBeat;
        lastBeat = millis();

        beatsPerMinute = 60 / (delta / 1000.0);

        if (beatsPerMinute < 255 && beatsPerMinute > 20)
        {
        rates[rateSpot++] = (byte)beatsPerMinute; //Store this reading in the array
        rateSpot %= RATE_SIZE; //Wrap variable

        //Take average of readings
        beatAvg = 0;
        for (byte x = 0 ; x < RATE_SIZE ; x++)
            beatAvg += rates[x];
        beatAvg /= RATE_SIZE;
        }
    }

    Serial.print("IR=");
    Serial.print(irValue);
    Serial.print(", BPM=");
    Serial.print(beatsPerMinute);
    Serial.print(", Avg BPM=");
    Serial.print(beatAvg);

    if (irValue < 50000)
        Serial.print(" No finger?");

    Serial.println();
    return 0;
}

bool send(float payload[5]) {
    char* variable[5] = {"temperature", "heart_rate", "gsr", "lat", "long"};
    String postData = "";

    // Construct POST data in JSON format (recommended)
    postData = "{";
    for (unsigned long i = 0; i < 5; i++) {
        postData += "\"" + String(variable[i]) + "\":" + String(payload[i]);
        if (i < 4) postData += ",";  // Add comma except for last element
    }
    postData += "}";

    String URL = API_URL;
    Serial.println("Sending POST to: " + URL);
    Serial.println("Data: " + postData);

    http.begin(client, URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-DEVICE-ID", "550e8400-e29b-41d4-a716-446655440000");

    int httpCode = http.POST(postData);
    
    if (httpCode > 0) {
        String response = http.getString();
        Serial.println("Server response: " + response);
    } else {
        Serial.println("Error on HTTP request: " + String(httpCode));
        http.end();
        return false;
    }

    http.end();
    return true;
}

void setup()
{
    Serial.begin(9600);
    lcd.init();
    lcd.backlight();
    LCD(0,0, "Auticare");
    setupWiFi();
    setupPulseSensor();
}


void loop()
{
    float payload[5] = {70.0,0.0,0.2,0.1,0.0};
    delay(1000);
    // readPulse();
    send(payload);
}
