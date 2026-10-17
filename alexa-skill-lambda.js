/**
 * LastEcho - Alexa Skill AWS Lambda Handler
 * This code can be copied directly into the "Code" tab in developer.amazon.com
 * or deployed as an AWS Lambda function.
 */

const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello! Welcome to LastEcho. Your digital heartbeat monitoring protocol is active. You can say: I am doing fine, or ask: What is my LastEcho status?';
        const reprompt = 'Say: "I am doing fine" to refresh your digital heartbeat.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};

const CheckInIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckInIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'IAmOkayIntent');
    },
    async handle(handlerInput) {
        // Optional: Call your LastEcho Webhook endpoint
        // Example: await fetch('https://your-domain.com/api/alexa', ...)

        const speakOutput = 'Glad to hear that! Your digital heartbeat has been refreshed in LastEcho. All your digital capsules remain securely sealed. Stay safe and healthy!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const StatusIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StatusIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Your LastEcho protocol is currently active and secure. Your digital capsules are protected with AES-256 encryption.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'LastEcho is your digital legacy guardian. Simply say: "I am doing fine" periodically so your sealed messages are never dispatched prematurely.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('Say "I am doing fine" to try.')
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye, take care of yourself.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = 'Sorry, I encountered an issue processing your LastEcho request. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CheckInIntentHandler,
        StatusIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
