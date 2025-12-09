require('dotenv').config();

console.log("Loaded Environment Variables containing 'SUPABASE':");
const keys = Object.keys(process.env).filter(key => key.includes('SUPABASE'));

if (keys.length === 0) {
    console.log("No SUPABASE variables found!");
} else {
    keys.forEach(key => {
        const val = process.env[key];
        const display = val ? `${val.substring(0, 5)}...` : '(empty)';
        console.log(`${key}: ${display}`);
    });
}
