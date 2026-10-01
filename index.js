// Main Bot File (index.js)
require('./deployLogColor.js');
require('./scripts/deployLogColor'); // <-- এটা বসাও
require('./main/catalogs/SAKIBA.js');

// নোটিফিকেশন চেকার শিডিউল (প্রতি ১ মিনিট পর পর চেক করার জন্য)
setInterval(() => {
    try {
        // যদি গ্লোবালি api অবজেক্ট থেকে থাকে অথবা SAKIBA.js এর মাধ্যমে হ্যান্ডেল হয়
        if (global.api) {
            require('./main/system/handle/handleNotification.js')({ api: global.api });
        }
    } catch (error) {
        console.error("Notification interval error:", error);
    }
}, 60000);
