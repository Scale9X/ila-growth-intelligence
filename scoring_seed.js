/* Scale9X Platform — scorecard configuration (seeded into the shared DB).
   Each area's `options` array index = points (0..max). Total of each scorecard = 100. */
const SCORECARDS = [
  {
    type: 'maturity', name: 'Scale9X Growth Maturity Scorecard', total: 100,
    bands: [[90,'A','Growth Leader'],[80,'B','Strong Growth Engine'],[70,'C','Growth Ready'],[60,'D','Growth Constrained'],[50,'E','Growth At Risk'],[0,'F','Growth Intervention Required']],
    categories: [
      { name:'Business Foundation', weight:10, areas:[
        { name:'Clear Business Model', options:['No clear model','Basic understanding','Clearly defined model with revenue drivers'] },
        { name:'Defined Growth Objectives', options:['No goals','General goals','Measurable 12-month goals'] },
        { name:'Strategic Direction', options:['Reactive business','Partial strategy','Documented growth strategy'] },
        { name:'Revenue Diversification', options:['Single revenue stream','Two revenue streams','Three or more meaningful streams'] },
        { name:'Scalability Potential', options:['Founder dependent','Partially scalable','Process-driven scalable model'] } ] },
      { name:'Market Position', weight:10, areas:[
        { name:'Market Opportunity', options:['Small/stagnant market','Moderate market','Large growing market'] },
        { name:'Market Share Potential', options:['Limited opportunity','Moderate opportunity','Significant expansion opportunity'] },
        { name:'Geographic Expansion Readiness', options:['Single market only','Expansion possible','Ready for multi-market expansion'] },
        { name:'Category Demand', options:['Weak demand','Stable demand','Strong growing demand'] },
        { name:'Market Differentiation', options:['Commodity offering','Some differentiation','Strong differentiation'] } ] },
      { name:'Customer Understanding', weight:10, areas:[
        { name:'ICP Definition', options:['No ICP','Broad ICP','Clearly defined ICP'] },
        { name:'Customer Segmentation', options:['No segmentation','Basic segmentation','Data-backed segmentation'] },
        { name:'Customer Insights', options:['Assumption based','Occasional research','Continuous insight process'] },
        { name:'Customer Retention Understanding', options:['No retention visibility','Basic understanding','Clear retention metrics & drivers'] },
        { name:'Buying Journey Mapping', options:['Unknown','Partial understanding','Fully mapped customer journey'] } ] },
      { name:'Competitive Strength', weight:10, areas:[
        { name:'Competitive Awareness', options:['Knows few competitors','Tracks occasionally','Active competitor intelligence'] },
        { name:'Unique Value Proposition', options:['Generic offering','Some differentiation','Clear and compelling UVP'] },
        { name:'Market Defensibility', options:['Easily copied','Some barriers','Strong moat'] },
        { name:'Competitive Monitoring', options:['No process','Informal monitoring','Formal monitoring process'] },
        { name:'Competitive Advantage', options:['No advantage','Temporary advantage','Sustainable advantage'] } ] },
      { name:'Sales Excellence', weight:15, areas:[
        { name:'Lead Management', options:['No process','Manual tracking','Structured workflow','Automated lead management'] },
        { name:'CRM Discipline', options:['No CRM','Spreadsheet','CRM installed','CRM integrated & actively used'] },
        { name:'Conversion Rates', options:['Below benchmark','Average','Above average','Top quartile performance'] },
        { name:'Sales Process Maturity', options:['Ad hoc','Basic process','Documented process','Optimized and measured'] },
        { name:'Forecasting & Reporting', options:['No forecasting','Basic reporting','Regular forecasting','Accurate predictive forecasting'] } ] },
      { name:'Marketing Effectiveness', weight:15, areas:[
        { name:'Strategy Quality', options:['No strategy','Tactical planning','Documented strategy','Data-driven growth strategy'] },
        { name:'Channel Mix', options:['Single channel','Multiple channels','Diversified mix','Optimized omnichannel'] },
        { name:'Performance Measurement', options:['No reporting','Channel reporting','Funnel reporting','Revenue attribution'] },
        { name:'Content & Brand Strength', options:['Weak presence','Basic presence','Consistent brand','Strong brand authority'] },
        { name:'Marketing ROI', options:['Unknown','Break-even','Positive ROI','Consistently scalable ROI'] } ] },
      { name:'Funnel Performance', weight:10, areas:[
        { name:'Funnel Visibility', options:['No visibility','Partial visibility','Full funnel visibility'] },
        { name:'Lead Qualification', options:['No qualification','Basic qualification','Structured qualification'] },
        { name:'Conversion Efficiency', options:['Low conversion','Average conversion','High conversion'] },
        { name:'Nurturing Process', options:['No nurturing','Manual nurturing','Automated nurturing'] },
        { name:'Funnel Optimization', options:['No optimization','Occasional improvements','Continuous optimization'] } ] },
      { name:'Technology & Data', weight:5, areas:[
        { name:'Tech Stack', options:['Inadequate tools','Appropriate tool stack'] },
        { name:'System Integration', options:['Siloed systems','Integrated systems'] },
        { name:'Automation', options:['Mostly manual','Automated workflows'] },
        { name:'Reporting', options:['Manual reporting','Automated dashboards'] },
        { name:'Data Accuracy', options:['Low confidence in data','Trusted and validated data'] } ] },
      { name:'Team & Operations', weight:5, areas:[
        { name:'Team Structure', options:['Undefined roles','Clear organization structure'] },
        { name:'Accountability', options:['No ownership','Clear ownership and KPIs'] },
        { name:'Talent Capability', options:['Capability gaps','Team fit for current stage'] },
        { name:'Leadership Alignment', options:['Misaligned leadership','Aligned leadership team'] },
        { name:'Operational Efficiency', options:['Inefficient operations','Efficient documented processes'] } ] },
      { name:'Financial Health', weight:10, areas:[
        { name:'Revenue Growth', options:['Declining revenue','Stable revenue','Growing revenue'] },
        { name:'Margin Health', options:['Weak margins','Healthy margins','Strong margins'] },
        { name:'Customer Economics', options:['Negative / unknown CAC-LTV','Positive economics','Strong scalable economics'] },
        { name:'Growth Investment Capacity', options:['No growth budget','Limited growth budget','Strong growth investment capacity'] },
        { name:'Financial Visibility', options:['Poor visibility','Basic reporting','Real-time financial visibility'] } ] }
    ]
  },
  {
    type: 'potential', name: 'Scale9X Growth Potential Scorecard', total: 100,
    bands: [[90,'Exceptional Potential','Category Leader Potential'],[80,'High Potential','Scale Candidate'],[70,'Strong Potential','Growth Ready'],[60,'Moderate Potential','Selective Growth'],[50,'Limited Potential','Structural Constraints'],[0,'Low Potential','Major Repositioning Needed']],
    categories: [
      { name:'Market Opportunity', weight:15, areas:[
        { name:'Market Size', options:['Very small niche market','Small market','Moderate market','Large market','Very large market','Massive global opportunity'] },
        { name:'Market Growth Rate', options:['Declining market','Flat market','Slow growth','Moderate growth','Fast growth','Hyper-growth market'] },
        { name:'Market Accessibility', options:['Difficult to enter','High barriers','Moderate barriers','Accessible with effort','Easily accessible','Highly accessible and scalable'] } ] },
      { name:'Product / Service Strength', weight:10, areas:[
        { name:'Product-Market Fit', options:['No evidence of fit','Some customer validation','Consistent demand','Strong product-market fit'] },
        { name:'Differentiation', options:['Commodity offering','Some differentiation','Clear differentiation','Unique category position'] },
        { name:'Customer Satisfaction', options:['Frequent complaints','Mixed feedback','Strong customer satisfaction'] },
        { name:'Repeatability', options:['Custom every time','Partially repeatable','Highly repeatable delivery'] } ] },
      { name:'Customer Demand', weight:10, areas:[
        { name:'Demand Consistency', options:['Sporadic demand','Seasonal demand','Consistent demand','Predictable year-round demand'] },
        { name:'Referral Potential', options:['No referrals','Occasional referrals','Strong referral behavior'] },
        { name:'Retention Potential', options:['Low retention','Moderate retention','High retention potential'] },
        { name:'Customer Urgency', options:['Nice-to-have solution','Useful solution','Important solution','Mission-critical solution'] } ] },
      { name:'Competitive Advantage', weight:10, areas:[
        { name:'Brand Strength', options:['Unknown brand','Recognized brand','Trusted brand'] },
        { name:'Unique Proposition', options:['Generic offering','Some differentiation','Clear differentiation','Difficult to replicate'] },
        { name:'Barriers to Entry', options:['No barriers','Some barriers','Significant barriers','Strong market barriers'] },
        { name:'Defensibility', options:['Easily copied','Some protection','Strong defensibility'] } ] },
      { name:'Revenue Expansion Potential', weight:15, areas:[
        { name:'Upsell Potential', options:['No upsell opportunity','Limited upsell','Good upsell opportunities','Strong upsell ecosystem'] },
        { name:'Cross-Sell Potential', options:['No cross-sell','Limited cross-sell','Good cross-sell options','Strong cross-sell portfolio'] },
        { name:'Pricing Power', options:['No pricing power','Some pricing flexibility','Strong pricing power','Premium pricing accepted'] },
        { name:'New Revenue Streams', options:['No opportunities','Idea stage','Viable opportunities','Clear monetizable streams'] },
        { name:'Lifetime Value Growth', options:['Limited potential','Some potential','Good potential','Strong LTV expansion potential'] } ] },
      { name:'Sales Scalability', weight:10, areas:[
        { name:'Lead Generation Capacity', options:['Low capacity','Moderate capacity','High scalable capacity'] },
        { name:'Sales Process Repeatability', options:['Ad hoc sales','Partially repeatable','Highly repeatable'] },
        { name:'CRM Readiness', options:['Not ready','Partially ready','Ready for scale'] },
        { name:'Conversion Potential', options:['Limited','Moderate','High'] },
        { name:'Team Expansion Readiness', options:['Not ready','Partially ready','Ready to scale'] } ] },
      { name:'Marketing Scalability', weight:10, areas:[
        { name:'Channel Expansion Potential', options:['Limited channels','Some expansion potential','Multiple scalable channels'] },
        { name:'Content Scalability', options:['Difficult to scale','Partially scalable','Highly scalable'] },
        { name:'Paid Media Scalability', options:['Poor economics','Moderate economics','Strong scalable economics'] },
        { name:'Brand Growth Potential', options:['Limited awareness potential','Moderate potential','Significant growth potential'] },
        { name:'Partnership Opportunities', options:['Few opportunities','Some opportunities','Strong partnership ecosystem'] } ] },
      { name:'Operational Scalability', weight:5, areas:[
        { name:'Process Maturity', options:['Ad hoc processes','Standardized processes'] },
        { name:'Automation Potential', options:['Limited automation opportunity','Significant automation opportunity'] },
        { name:'Delivery Capacity', options:['Capacity constrained','Capacity scalable'] },
        { name:'Vendor Ecosystem', options:['Weak ecosystem','Strong ecosystem'] },
        { name:'Systemization Potential', options:['Difficult to systemize','Easily systemized'] } ] },
      { name:'Geographic Expansion Potential', weight:5, areas:[
        { name:'Market Replicability', options:['Location dependent','Partially replicable','Easily replicable across markets'] },
        { name:'Regional Expansion Readiness', options:['No readiness','Some readiness','Ready for expansion'] },
        { name:'Localization Complexity', options:['High localization complexity','Low localization complexity'] } ] },
      { name:'Leadership & Growth Readiness', weight:10, areas:[
        { name:'Founder Ambition', options:['Lifestyle business mindset','Moderate growth ambition','Aggressive growth ambition'] },
        { name:'Decision-Making Speed', options:['Slow decisions','Moderate speed','Fast decisive leadership'] },
        { name:'Investment Appetite', options:['Avoids investment','Selective investment','Willing to invest for growth'] },
        { name:'Change Readiness', options:['Resistant to change','Open to change','Actively drives change'] },
        { name:'Leadership Capability', options:['Leadership gaps','Adequate leadership','Strong leadership team'] } ] }
    ]
  }
];
const STRUCTURAL = ['Business Foundation','Financial Health','Team & Operations'];
module.exports = { SCORECARDS, STRUCTURAL };
