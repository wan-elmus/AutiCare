#include "postman.h"

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "lcd.h"

WiFiClient client;
HTTPClient http;

const char* ssid = "universe";
const char* password = "one2eight!";
const char* API_URL = "http://192.168.100.7:8000/sensor/data";

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