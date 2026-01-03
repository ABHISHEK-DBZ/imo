export type ContextType = 'General' | 'Hospital' | 'Class' | 'Shop';

const CONTEXT_PATTERNS: Record<ContextType, Record<string, string[]>> = {
    General: {
        'Hello': ['Hello, how are you?', 'Hi there!'],
        'Help': ['Can you help me?', 'I need assistance.'],
        'Thanks': ['Thank you very much.', 'Thanks a lot.'],
        'Yes': ['Yes, that is correct.', 'Sure.'],
        'No': ['No, thank you.', 'I don\'t think so.'],
    },
    Hospital: {
        'Hello': ['Hello, Doctor.', 'Hi, Nurse.'],
        'Help': ['I need a doctor immediately.', 'Please call a nurse.'],
        'Pain': ['I am experiencing severe pain.', 'It hurts right here.'],
        'Water': ['Can I get some water, please?', 'I am thirsty.'],
        'Thanks': ['Thank you for your care.', 'Thanks for helping me.'],
    },
    Class: {
        'Hello': ['Good morning, Teacher.', 'Hi everyone.'],
        'Help': ['I have a doubt.', 'Can you explain this again?'],
        'Yes': ['I understand.', 'Present, sir/ma\'am.'],
        'No': ['I didn\'t get that.', 'I disagree.'],
        'Thanks': ['Thank you for the explanation.', 'Thanks, teacher.'],
    },
    Shop: {
        'Hello': ['Hi, do you have this item?', 'Hello, I am looking for something.'],
        'Help': ['Where is the billing counter?', 'Can you show me the price?'],
        'Yes': ['I will take this.', 'Yes, pack it please.'],
        'No': ['No, that\'s too expensive.', 'I don\'t need a bag.'],
        'Thanks': ['Thank you.', 'Keep the change.'],
    }
};

export const enhanceMeaning = (rawSign: string, context: string, emotion: 'Neutral' | 'Happy' | 'Urgent' = 'Neutral'): string => {
    const ctx = (Object.keys(CONTEXT_PATTERNS).includes(context) ? context : 'General') as ContextType;
    const patterns = CONTEXT_PATTERNS[ctx];

    let baseSentence = rawSign;

    // Simple lookup
    if (patterns && patterns[rawSign]) {
        const options = patterns[rawSign];
        baseSentence = options[Math.floor(Math.random() * options.length)];
    }

    // Emotion Infusion Logic
    if (emotion === 'Urgent') {
        if (rawSign.toLowerCase() === 'help') return "EMERGENCY! I need help immediately!";
        if (rawSign.toLowerCase() === 'pain') return "It hurts a lot! Please help!";
        return `${baseSentence.toUpperCase()}! HURRY!`;
    }

    if (emotion === 'Happy') {
        if (rawSign.toLowerCase() === 'hello') return "Hello! So glad to see you!";
        if (rawSign.toLowerCase() === 'thanks') return "Thank you so much!";
        return `${baseSentence} 😊`;
    }

    return baseSentence;
};
