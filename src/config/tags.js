const defaultTags = ['karawang', 'jakarta', 'bogor', 'bandung', 'surabaya'];

// If environment variable ALLOW_ALL_TAGS is set (1 or true), make includes always return true
const allowAll = (process.env.ALLOW_ALL_TAGS === '1' || process.env.ALLOW_ALL_TAGS === 'true');

if (allowAll) {
    // Create a proxy that behaves like an array but with includes() always true
    const handler = {
        get(target, prop) {
            if (prop === 'includes') return () => true;
            return Reflect.get(target, prop);
        }
    };
    module.exports = new Proxy(defaultTags, handler);
} else {
    module.exports = defaultTags;
}
