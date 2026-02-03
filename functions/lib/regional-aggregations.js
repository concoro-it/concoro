"use strict";
/**
 * Firebase Cloud Functions for pre-computing regional aggregations
 * This runs automatically when concorsi are added/updated
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRegionalStats = exports.updateRegionalAggregations = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const firestore_2 = require("firebase-admin/firestore");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
const db = (0, firestore_2.getFirestore)();
/**
 * Updates regional aggregations when a concorso is created/updated/deleted
 */
exports.updateRegionalAggregations = (0, firestore_1.onDocumentWritten)('concorsi/{docId}', async (event) => {
    var _a, _b, _c, _d;
    const beforeData = (_b = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before) === null || _b === void 0 ? void 0 : _b.data();
    const afterData = (_d = (_c = event.data) === null || _c === void 0 ? void 0 : _c.after) === null || _d === void 0 ? void 0 : _d.data();
    console.log('🔄 Updating regional aggregations...');
    // Extract regions from both old and new data
    const oldRegions = (beforeData === null || beforeData === void 0 ? void 0 : beforeData.regione) || [];
    const newRegions = (afterData === null || afterData === void 0 ? void 0 : afterData.regione) || [];
    // Get all affected regions
    const allRegions = new Set([...oldRegions, ...newRegions]);
    // Update aggregations for each affected region
    const updatePromises = Array.from(allRegions).map(async (region) => {
        if (typeof region === 'string') {
            await updateRegionStats(region);
        }
    });
    await Promise.all(updatePromises);
    console.log('✅ Regional aggregations updated');
});
/**
 * Updates statistics for a specific region
 */
async function updateRegionStats(regionName) {
    const regionRef = db.collection('regional_stats').doc(regionName.toLowerCase());
    try {
        // Query all concorsi for this region
        const concorsiSnapshot = await db.collection('concorsi')
            .where('regione', 'array-contains', regionName.toLowerCase())
            .get();
        const stats = {
            totalConcorsi: 0,
            openConcorsi: 0,
            topEnti: {},
            topSettori: {},
            lastUpdated: new Date()
        };
        // Calculate aggregations
        concorsiSnapshot.docs.forEach(doc => {
            var _a;
            const data = doc.data();
            stats.totalConcorsi++;
            // Count open concorsi
            if (data.stato_normalized === 'open' || ((_a = data.Stato) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'open') {
                stats.openConcorsi++;
            }
            // Count by ente
            if (data.Ente) {
                stats.topEnti[data.Ente] = (stats.topEnti[data.Ente] || 0) + 1;
            }
            // Count by settore
            if (data.settore_professionale) {
                stats.topSettori[data.settore_professionale] = (stats.topSettori[data.settore_professionale] || 0) + 1;
            }
        });
        // Save aggregated stats
        await regionRef.set(stats);
        console.log(`📊 Updated stats for ${regionName}: ${stats.totalConcorsi} total, ${stats.openConcorsi} open`);
    }
    catch (error) {
        console.error(`❌ Error updating stats for ${regionName}:`, error);
    }
}
/**
 * Initialize all regional stats (run manually)
 */
const initializeRegionalStats = async () => {
    console.log('🚀 Initializing all regional stats...');
    // Get all unique regions
    const concorsiSnapshot = await db.collection('concorsi').get();
    const allRegions = new Set();
    concorsiSnapshot.docs.forEach(doc => {
        const regions = doc.data().regione || [];
        regions.forEach((region) => allRegions.add(region));
    });
    // Update stats for each region
    const updatePromises = Array.from(allRegions).map(region => updateRegionStats(region));
    await Promise.all(updatePromises);
    console.log(`✅ Initialized stats for ${allRegions.size} regions`);
};
exports.initializeRegionalStats = initializeRegionalStats;
//# sourceMappingURL=regional-aggregations.js.map