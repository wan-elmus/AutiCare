#include "data.h"
#include "postman.h"

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "lcd.h"

WiFiClient client;
HTTPClient http;

const char* ssid = "universe";
const char* password = "one2eight!";
// const char* API_URL = "http://192.168.100.7:8000/sensor/data";
const char* API_URL = "http://192.168.100.8:7777/test";

bool setupWiFi(){
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
    return true;
}

bool send(const SensorData &payload) {
    // Construct JSON payload directly
    String postData = "{";
    postData += "\"temperature\":" + String(payload.temperature, 6) + ",";
    postData += "\"heart_rate\":" + String(payload.BPM, 6) + ",";
    postData += "\"gsr\":" + String(payload.GSR) + ",";
    postData += "\"lat\":0.000000,";  // Hardcoded latitude
    postData += "\"long\":0.000000";  // Hardcoded longitude
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