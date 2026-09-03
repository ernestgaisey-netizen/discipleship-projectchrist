<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Module;
use App\Models\User;
use Illuminate\Database\Seeder;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('sub_role', 'super_admin')->first();

        // Only Discipleship course — Faith Foundation, Discipleship Call, Kingdom Living
        // were removed by admin; they are excluded here so re-seeding never restores them.
        $courses = [

            // ── COURSE 4 ──────────────────────────────────────────────────────
            [
                'title'               => 'Discipleship',
                'subtitle'            => 'Walking in the Way of Christ',
                'description'         => 'A deep, scripture-grounded journey into the Father\'s love, the believer\'s identity in Christ, and the foundations of discipleship — rooted in Paul\'s letters and the finished work of Christ.',
                'category'            => 'Identity in Christ',
                'level'               => 'intermediate',
                'duration_weeks'      => 6,
                'emoji'               => '🙏',
                'gradient'            => 'linear-gradient(135deg,#1A0533,#6B21A8)',
                'accent_color'        => '#7C3AED',
                'badge_name'          => 'Disciple of Christ',
                'objectives'          => [
                    'Understand the Father\'s love revealed in Christ',
                    'Know the full reality of redemption and righteousness in Christ',
                    'Walk in the new creation identity',
                    'Experience fellowship with the Father and indwelling of the Spirit',
                    'Exercise authority in Christ and live a devoted life',
                ],
                'target_audience'     => ['Growing believers', 'Those wanting deep doctrinal grounding', 'Disciples who want to disciple others'],
                'prerequisites'       => ['Faith Foundation'],
                'instructor_name'     => 'Project Christ Team',
                'certificate_enabled' => true,
                'is_published'        => true,
                'order_index'         => 4,
                'modules'             => [
                    [
                        'title'          => 'Understanding the Father\'s Love in Christ',
                        'order_index'    => 1,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Ephesians 1:3-7','2 Timothy 1:9-10','1 Peter 1:18-20','Romans 5:5, 8-10, 12','Ephesians 2:1-7','2 Corinthians 5:18-21','Colossians 1:12-14, 21-22','Galatians 4:4-7','John 3:16','1 John 4:9-10, 13','Romans 8:1, 15-17, 31-39','Philemon 1:6','Ephesians 3:14-19','1 Corinthians 1:9','John 10:28-29','Hebrews 9:12','Hebrews 10:10-14, 17-22','Hebrews 2:9, 14-15','Hebrews 7:25','Romans 4:25','Romans 6:1-11, 23','1 Corinthians 1:30','2 Corinthians 5:21','Colossians 1:22','Colossians 2:10-15','Ephesians 2:10','Ephesians 4:8-10','Matthew 12:40','Acts 2:27, 31','Acts 13:34-39','1 John 5:11-13'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 1: Understanding the Father's Love in Christ</h2>

<p>Before the foundation of the world, God's purpose was already established in Christ. God did not begin His plan with man's failure; He began with His eternal purpose in Christ. Man was created in God's image for fellowship, sonship, and divine purpose. But the full revelation of the Father's love is found in <strong>Jesus Christ</strong> (Ephesians 1:3-7; 2 Timothy 1:9-10).</p>

<h2>Introduction</h2>

<p>We must see and appreciate that God's love for us is revealed <strong>in Christ</strong>, especially in His death, burial, resurrection, and present ministry. God's love is not primarily proven by money, possessions, open doors, breakthroughs, or comfort. God may provide for His children, but the highest demonstration of His love is Christ Himself.</p>

<div style="background:#EFF6FF;border-left:4px solid #2D7DD2;padding:15px 18px;border-radius:0 9px 9px 0;margin:18px 0;font-style:italic;color:#1B4F8A;font-family:Lora,serif">
  Romans 5:8 says, <em>"But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us."</em>
</div>

<p>The question, "How do you know God loves you?" must be answered from the gospel, not from circumstances. If a person says, "I know God loves me because I have a good house, a good career, or open doors," that person may begin to doubt God's love when circumstances change. God's love is not measured by material possessions.</p>

<div style="background:#EFF6FF;border-left:4px solid #2D7DD2;padding:15px 18px;border-radius:0 9px 9px 0;margin:18px 0;font-style:italic;color:#1B4F8A;font-family:Lora,serif">
  Philemon 1:6 says, <em>"That the communication of thy faith may become effectual by the acknowledging of every good thing which is in you in Christ Jesus."</em> <strong>This means the believer's faith becomes effective through the precise knowledge and acknowledgement of what is already true in Christ.</strong>
</div>

<p>Through Adam's sin, death entered the human experience. Man became spiritually dead, alienated in the mind, and separated from the life of God. The problem was deeper than wrong actions — it was a spiritual condition that required redemption in Christ (Romans 5:12; Ephesians 2:1-5).</p>

<p>God's love was not a reaction to man's failure. God had already purposed redemption in Christ before the foundation of the world. Christ is the full manifestation of God's love for humanity.</p>

<div style="background:#EFF6FF;border-left:4px solid #2D7DD2;padding:15px 18px;border-radius:0 9px 9px 0;margin:18px 0;font-style:italic;color:#1B4F8A;font-family:Lora,serif">
  1 John 4:9 says, <em>"In this was manifested the love of God toward us, because that God sent his only begotten Son into the world, that we might live through him."</em>
</div>

<p>Through Christ Jesus, God reconciled us to Himself and brought us into sonship. We are not merely forgiven servants; we are sons and heirs through faith in Christ. The believer now has access, acceptance, and fellowship with the Father through the Son by the Spirit (Galatians 4:4-7; Ephesians 2:18).</p>

<h3>Four Dimensions of God's Love (Ephesians 3:14-19)</h3>
<ul>
  <li><strong>Breadth:</strong> God's plan in Christ is for all men — regardless of race, background, or past. The gospel is not restricted.</li>
  <li><strong>Length:</strong> The eternal security and permanence of what God has done — nothing can separate us from the love of God in Christ (Romans 8:38-39).</li>
  <li><strong>Depth:</strong> How far Christ went in identifying with man's condition — through death, burial, and descent — to bring us up with Him.</li>
  <li><strong>Height:</strong> Christ's resurrection, ascension, and present ministry at the Father's right hand — and the believer's position in Him (Ephesians 2:6).</li>
</ul>

<h3>Key Doctrinal Notes</h3>
<ul>
  <li>God's love IS not primarily proven by material possessions, open doors, or breakthroughs. It is proven by the gospel (Romans 5:8).</li>
  <li>Hebrews 9:12: Christ obtained eternal redemption by His own blood — not temporary, not conditional, but eternal.</li>
  <li>Romans 8:38-39: Nothing can separate the believer from the love of God in Christ Jesus our Lord.</li>
  <li>The believer's identity: sons and heirs through faith, not forgiven servants trying to earn God's favour.</li>
  <li>Holiness is first who the believer IS in Christ before it is expressed in conduct — position precedes practice.</li>
  <li>Philemon 1:6: Faith becomes effectual through the precise acknowledgement of every good thing already in us in Christ.</li>
</ul>
HTML,
                        'content_text'   => 'The Father\'s love is not measured by circumstances but revealed in Christ and His finished work — believers are sons and heirs, not servants earning favour, and nothing can separate them from God\'s love.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of Our Redemption in Christ',
                        'order_index'    => 2,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['1 Corinthians 15:1-4', 'Romans 4:25', '2 Corinthians 5:21', 'Romans 8:1', 'Colossians 2:13-15', 'Ephesians 1:7', 'Romans 5:1', 'Hebrews 2:14-15'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 2: The Reality of Our Redemption in Christ</h2>
<p><em>"It is finished." — John 19:30</em></p>
<p>The gospel is not advice; it is news. It is anchored on verifiable facts: Christ died for our sins, He was buried, and He rose again according to the Scriptures (1 Corinthians 15:1-4). These facts are the foundation of faith, growth, holiness, assurance, and every Christian practice.</p>
<p>When we say "Jesus died for us," we are declaring substitution — what should have happened to the sinner happened to Jesus in our place. The message is not primarily about what man must do for God; it is about what God has done for man in Christ.</p>
<p>Jesus did not live as a sinner — He knew no sin. Yet on the cross, He was made sin for us so that we might be made the righteousness of God in Him (2 Corinthians 5:21). He stood in our place as the sin-bearer and substitute. The believer's righteousness is therefore not earned by good behaviour — it is received in Christ by faith.</p>
<p>Redemption is not complete in the cross alone if the resurrection is ignored. Christ died for our sins, but He was raised for our justification (Romans 4:25). The resurrection is God's declaration that the sacrifice was accepted, sin was dealt with, and the believer now has a new life and new standing in Christ.</p>
<h3>Key Redemption Truths</h3>
<ul>
  <li><strong>The burial</strong> of Christ signifies the completeness and finality of the sacrifice — sin was dealt with in Christ, not temporarily covered.</li>
  <li><strong>Colossians 2:13-15:</strong> The handwriting of requirements against us was cancelled and nailed to the cross; principalities and powers were disarmed and publicly triumphed over.</li>
  <li><strong>Ephesians 1:7:</strong> Forgiveness is a present possession in Christ, not a future possibility to work toward.</li>
  <li><strong>Romans 8:1:</strong> There is now no condemnation for those in Christ Jesus.</li>
  <li><strong>Hebrews 2:14-15:</strong> Through death, Christ destroyed him who had the power of death — the devil — and delivered those in fear of death.</li>
  <li><strong>2 Corinthians 5:17:</strong> The believer is a new creation; old things have passed away.</li>
  <li>Holiness and good works are the fruit of the new life received, not the price for acceptance before God.</li>
</ul>
HTML,
                        'content_text'   => 'The gospel is founded on facts — Christ died for our sins, was buried, and rose for our justification. Through His substitutionary work, the believer is forgiven, justified, and a new creation, with no condemnation in Christ.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of Our Righteousness in Christ',
                        'order_index'    => 3,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Romans 5:17', '2 Corinthians 5:21', 'Romans 3:21-26', 'Romans 8:1', 'Romans 5:1-2', 'Philippians 3:9', 'Galatians 3:13', 'Hebrews 10:19-22'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 3: The Reality of Our Righteousness in Christ</h2>
<p><em>"He made Him who knew no sin to be sin for us, that we might become the righteousness of God in Him." — 2 Corinthians 5:21</em></p>
<p>The revelation of righteousness in Christ is one of the most liberating truths in Scripture. Christianity is not primarily about moral improvement or religious performance but about a righteousness that comes from God through faith in Christ Jesus — what Paul calls "the righteousness of God."</p>
<p>The church has often confused righteousness with righteous behaviour. But the Bible presents righteousness first as a gift — a new standing before God that precedes and produces right living. Many believers strive to become righteous through effort, not realising that righteousness is first a position in Christ, and that position is the basis for all righteous conduct.</p>
<p>The goal of this module is to establish in the heart of every believer the unshakeable reality: "I am the righteousness of God in Christ Jesus." This is not presumption; it is what the Word of God declares (2 Corinthians 5:21).</p>
<h3>Key Righteousness Truths</h3>
<ul>
  <li><strong>Romans 1:17:</strong> The just shall live by faith — the entire epistle to the Romans demonstrates that righteousness is God's gift, not man's achievement.</li>
  <li><strong>Romans 3:20:</strong> By the deeds of the law no flesh will be justified — the law reveals sin but cannot produce righteousness.</li>
  <li><strong>Romans 4:5:</strong> Righteousness is credited to the one who does not work but believes on Him who justifies the ungodly.</li>
  <li><strong>Romans 5:19:</strong> By one Man's obedience, many will be made righteous — the obedience of Christ is the basis of the believer's righteousness.</li>
  <li><strong>1 Corinthians 1:30:</strong> God has made Christ unto us wisdom, righteousness, sanctification, and redemption.</li>
  <li><strong>Hebrews 10:19-22:</strong> Believers can enter the Holiest with boldness by the blood of Jesus — not timidly, but with full assurance.</li>
  <li><strong>Isaiah 54:14:</strong> "In righteousness you shall be established" — righteousness-consciousness produces stability.</li>
  <li>Righteousness-consciousness gives boldness in prayer, freedom from guilt, and the basis for effective faith-sharing.</li>
  <li>Knowing your righteousness in Christ is NOT licence to sin — it is the foundation for producing the fruit of righteousness in daily life.</li>
</ul>
HTML,
                        'content_text'   => 'Righteousness is first a gift received in Christ — a new standing before God — not earned through moral effort. The believer is the righteousness of God in Christ Jesus, and this truth produces boldness, freedom, and fruitfulness.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of the New Creation in Christ',
                        'order_index'    => 4,
                        'duration_minutes' => 75,
                        'scripture_refs' => ['2 Corinthians 5:17', 'Ephesians 2:4-6', 'Galatians 2:20', 'Romans 6:11', '1 Corinthians 6:17', 'Romans 8:1', 'Colossians 3:1-4', 'Romans 12:2'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 4: The Reality of the New Creation in Christ</h2>
<p><em>"If anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new." — 2 Corinthians 5:17</em></p>
<p>When Paul writes "if anyone is in Christ, he is a new creation," he is not describing a renovation — he is declaring a recreation. God does not improve the old Adamic nature; He gives an entirely new one. The new creation is not a reformed version of the old man — it is a new species of being, born of the Spirit of God.</p>
<p>The new creation is not a description of moral improvement or resolved intentions. It is an ontological statement — a statement about being and nature. The believer in Christ is a fundamentally different being from the person who existed before regeneration. This is not language of improvement; it is language of creation, birth, and new life.</p>
<p>Many believers live as though they are still what they were before they met Christ — struggling with sin-consciousness, identity confusion, and a sense that they do not measure up. They are unaware that in their new birth, a total transformation of their inner being has already occurred.</p>
<h3>Five Realities of the New Creation</h3>
<ul>
  <li><strong>A new identity:</strong> You are a new being, a child of God born of the Spirit — not a reformed version of the old man (2 Corinthians 5:17; 1 Peter 2:9).</li>
  <li><strong>A new union:</strong> You are one spirit with the Lord (1 Corinthians 6:17); Christ lives in you (Galatians 2:20); you share in the divine nature (2 Peter 1:4).</li>
  <li><strong>A new righteousness:</strong> You are the righteousness of God in Christ — not a sinner saved by grace still struggling for acceptance, but a new creation fully accepted (Colossians 2:10).</li>
  <li><strong>A new liberty:</strong> You are free from sin's dominion and the law's condemnation — sin shall not have dominion over you (Romans 6:14; Galatians 5:1).</li>
  <li><strong>A new mindset:</strong> You are called to think from the standpoint of your new identity — the renewed mind is the mechanism through which new creation realities become practical (Romans 12:2; Colossians 3:1-2).</li>
</ul>
<h3>Key New Creation Truths</h3>
<ul>
  <li>Colossians 2:10: The believer is complete in Christ — not becoming complete, not partially complete, but already complete.</li>
  <li>Ephesians 2:4-6: God raised us up and seated us together with Christ in the heavenly places — a present reality, not a future promise.</li>
  <li>Romans 8:2: The law of the Spirit of life in Christ Jesus has set the believer free from the law of sin and death.</li>
  <li>1 Corinthians 2:16: Believers have the mind of Christ — this shapes how we approach every decision and challenge.</li>
  <li>John 5:24: The believer has already passed from death to life — eternal life is a present possession, not only a future hope.</li>
</ul>
HTML,
                        'content_text'   => 'The believer is a new creation in Christ — not reformed but recreated. Old things have passed away. Five realities define the new creation: new identity, union with Christ, righteousness, liberty, and a renewed mindset.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of Our Fellowship with the Father in Christ',
                        'order_index'    => 5,
                        'duration_minutes' => 75,
                        'scripture_refs' => ['1 Corinthians 1:9', '1 John 1:3', 'Ephesians 2:18', 'Hebrews 10:19-22', 'Romans 8:15-16', '1 John 4:13', 'Ephesians 3:12', 'John 14:20'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 5: The Reality of Our Fellowship with the Father in Christ</h2>
<p><em>"God is faithful, by whom you were called into the fellowship of His Son, Jesus Christ our Lord." — 1 Corinthians 1:9</em></p>
<p>One of the highest privileges of redemption — and yet one of the least understood in the contemporary church — is fellowship with God the Father. The gospel does not merely rescue us from hell; it restores us to the Father. This was God's original intention: a family of sons and daughters who walk with Him, know Him intimately, and enjoy His presence as the very substance of their lives.</p>
<p>The Greek word for fellowship is koinōnia — it carries multiple layers of meaning: sharing, participation, communion, joint ownership, and partnership. True fellowship with the Father is personal, continuous, and transforming. It is not an event that happens once a week in a church building — it is the ongoing, daily reality of a believer who lives in Christ.</p>
<h3>Two Common Errors About Fellowship with God</h3>
<ul>
  <li><strong>Distance:</strong> The idea that God is remote, relating to us primarily through rules, and that access is restricted to specially qualified individuals. This is false — the veil was torn (Matthew 27:51).</li>
  <li><strong>Formalism:</strong> Reducing fellowship with God to attending services, performing rituals, or following devotional routines without genuine encounter. God wants relationship, not religious performance.</li>
</ul>
<h3>Five Dimensions of Fellowship with the Father</h3>
<ul>
  <li><strong>Access:</strong> Ephesians 2:18 — through Christ, by one Spirit, we have access to the Father. Ephesians 3:12 — boldness and access with confidence through faith in Him. Hebrews 10:19-22 — we can enter the Holiest by the blood of Jesus with full assurance.</li>
  <li><strong>Intimacy:</strong> Romans 8:15-16 — the Spirit of adoption enables the believer to cry "Abba, Father." Galatians 4:6: God sent the Spirit of His Son into our hearts. The Aramaic "Abba" carries the intimacy of "Daddy."</li>
  <li><strong>Restoration:</strong> 1 John 1:9 — if we confess our sins, He is faithful and just to forgive us and cleanse us. Fellowship is not permanently broken by sin; it is restored through confession.</li>
  <li><strong>Knowledge:</strong> Jeremiah 31:34 — all New Covenant members shall know God. John 10:27 — His sheep hear His voice. Psalm 25:14 — the secret (intimate counsel) of the Lord is with those who fear Him.</li>
  <li><strong>Mutual indwelling:</strong> John 14:20 — "I am in My Father, and you in Me, and I in you." John 17:21-23 — the goal of Christ's atonement was to include believers in the fellowship of the Father and Son. 1 John 1:3 — our fellowship is with the Father and with His Son.</li>
</ul>
<p>Summary: God is not distant — He is near. God is not reluctant — He is willing. God is not a stranger — He is our Father. The veil is torn. The way is open. Come boldly.</p>
HTML,
                        'content_text'   => 'Fellowship with the Father is every believer\'s birthright through Christ\'s blood, not a reward for the spiritually advanced. The Spirit of adoption enables us to cry "Abba, Father" and enjoy ongoing, intimate communion with God.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of the Indwelling of the Holy Spirit',
                        'order_index'    => 6,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Romans 8:9-11', '1 Corinthians 3:16', '1 Corinthians 6:17-19', 'Galatians 4:6', 'Ephesians 1:13-14', 'Colossians 1:27', 'Galatians 5:22-23', '2 Timothy 1:7'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 6: The Reality of the Indwelling of the Holy Spirit</h2>
<p><em>"Do you not know that your body is the temple of the Holy Spirit who is in you?" — 1 Corinthians 6:19</em></p>
<p>The indwelling of the Holy Spirit is one of the defining hallmarks of the New Covenant believer. Under the Old Covenant, the Spirit of God came upon individuals for specific tasks. He anointed for service but was not given as a permanent, personal indwelling to every believer. Ezekiel 36:26-27 foresaw a day when this would change: "I will put My Spirit within you."</p>
<p>Romans 8:9 is categorical: "If anyone does not have the Spirit of Christ, he is not His." The presence of the Holy Spirit in the believer is not optional, progressive, or dependent on spiritual maturity — it is the distinguishing mark of belonging to Christ.</p>
<h3>Four Realities of the Indwelling Holy Spirit</h3>
<ul>
  <li><strong>1. God's Seal and Ownership (Ephesians 1:13-14):</strong> The Spirit is the seal of God's ownership and the arrabōn (guarantee/first instalment) of the believer's inheritance. The seal cannot be broken by the believer's failures — it is God's act and God's responsibility to keep.</li>
  <li><strong>2. The Life of the New Creation (Romans 8:10-11):</strong> The same Spirit who raised Christ from the dead dwells in the believer. Resurrection power is not merely a historical event — it is an internal reality. Titus 3:5 confirms: saved through washing of regeneration and renewing of the Holy Spirit.</li>
  <li><strong>3. Witness of Sonship (Romans 8:15-16; Galatians 4:6):</strong> The Spirit bears witness with our spirit that we are children of God. He causes the believer to cry "Abba, Father." Romans 8:26-27: the Spirit makes intercession for us with groanings that cannot be uttered.</li>
  <li><strong>4. Power for Expression, Fruit, and Ministry:</strong> Acts 1:8 — power for witness. Galatians 5:22-23 — the fruit of the Spirit (love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control). 2 Timothy 1:7 — power, love, and a sound mind. Romans 8:14 — being led by the Spirit is the mark of sons of God.</li>
</ul>
<h3>Key Notes</h3>
<ul>
  <li>The Holy Spirit is the third Person of the Trinity — fully God, not a force or feeling.</li>
  <li>Every believer receives the Holy Spirit at the moment of new birth — not as a second blessing or reward (Romans 8:9; Ephesians 1:13).</li>
  <li>Colossians 1:27: "Christ in you, the hope of glory." The Spirit is the agent of the indwelling Christ.</li>
  <li>Grieving the Holy Spirit (Ephesians 4:30) means acting contrary to His nature through sin or unforgiveness.</li>
  <li>1 John 2:27: the anointing abides in the believer and teaches them concerning all things.</li>
</ul>
HTML,
                        'content_text'   => 'Every born-again believer is permanently indwelt by the Holy Spirit — God\'s seal of ownership, the life of the new creation, the witness of sonship, and the power source for witness, fruit, and ministry.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of Our Authority in Christ',
                        'order_index'    => 7,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Colossians 2:13-15', 'Ephesians 1:19-23', 'Ephesians 2:4-6', 'Philippians 2:9-11', 'Romans 5:17', 'Matthew 28:18-20', '2 Timothy 1:7', 'James 4:7'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 7: The Reality of Our Authority in Christ</h2>
<p><em>"All authority has been given to Me in heaven and on earth." — Matthew 28:18</em></p>
<p>The authority of the believer is one of the most important — and most frequently misunderstood — truths in the New Testament. The authority we are speaking of is not self-generated authority. It is the authority of the Name and the position of the One in whom we stand. It flows entirely from who Christ is and what He has done, and it belongs to every believer by virtue of their union with Christ.</p>
<p>At the cross, Jesus Christ defeated every principality and power. Colossians 2:14-15: "Having disarmed principalities and powers, He made a public spectacle of them, triumphing over them in it." In His ascension, He was exalted to the highest position of authority. Ephesians 1:20-23: seated at God's right hand "far above all principality and power and might and dominion." Ephesians 2:6: "He raised us up together, and made us sit together in the heavenly places in Christ Jesus."</p>
<h3>Four Dimensions of Authority in Christ</h3>
<ul>
  <li><strong>1. The Source (Colossians 2:14-15; Ephesians 1:20-23):</strong> All authority flows from Christ's finished work — the cross disarmed the enemy, the resurrection conquered death, the ascension enthroned Christ, and the Spirit was sent to make it operative in the body.</li>
  <li><strong>2. The Scope (Ephesians 2:6; Romans 5:17):</strong> The believer is seated with Christ — "far above all principality and power." Romans 5:17: believers "reign in life through Jesus Christ." 1 John 4:4: "Greater is He who is in you than he who is in the world."</li>
  <li><strong>3. The Expression (Philippians 2:9-11; Acts 3:6):</strong> Authority is expressed through the name of Jesus, through prayer aligned with Christ's will (John 14:13-14), and through the proclamation of the gospel (Romans 1:16).</li>
  <li><strong>4. The Safeguards (James 4:7; 2 Timothy 1:7):</strong> Submit to God first (James 4:7). Love governs all authority (1 Corinthians 13). A sound mind (2 Timothy 1:7). Scripture as the boundary (2 Corinthians 10:5).</li>
</ul>
<h3>Key Authority Truths</h3>
<ul>
  <li>Authority (exousia) = the right, legal standing, and delegated power to act. Different from mere force (dunamis).</li>
  <li>Acts 19:15 warns: the name of Jesus cannot be used as a formula by those without genuine relationship with Christ.</li>
  <li>Revelation 12:11: overcomers overcome by the blood of the Lamb and the word of their testimony.</li>
  <li>The believer's authority is for the advancement of the Kingdom and the defeat of the enemy's works — not personal advantage.</li>
</ul>
HTML,
                        'content_text'   => 'The believer\'s authority in Christ is derived from His finished work, exercised in His name, and safeguarded by submission to God, love, sound judgement, and Scripture — it is real, present, and delegated to every believer.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Reality of Our Fellowship with One Another',
                        'order_index'    => 8,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Acts 2:41-47', 'Acts 4:32-35', 'Romans 12:4-13', '1 Corinthians 12:12-27', 'Ephesians 4:1-16', 'Hebrews 10:24-25', 'Colossians 3:12-17', '1 John 4:7-12'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 8: The Reality of Our Fellowship with One Another</h2>
<p><em>"…you are fellow citizens with the saints and members of the household of God." — Ephesians 2:19</em></p>
<p>The New Testament is saturated with "one another" language — love one another, bear one another's burdens, encourage one another, pray for one another. These commands cannot be fulfilled in isolation. They require a community. Fellowship (Greek: koinōnia) is not merely attending a service — it is a shared participation in the life of Christ, a new-creation reality that salvation produces.</p>
<h3>Four Dimensions of Fellowship with One Another</h3>
<ul>
  <li><strong>1. Foundation — Union with Christ (1 Corinthians 12:12-13):</strong> "By one Spirit we were all baptized into one body." Fellowship is not something the believer creates — it is something they discover. 1 John 1:3-7: vertical fellowship with the Father produces horizontal fellowship with one another. Ephesians 3:10: the Church displays God's wisdom to principalities and powers.</li>
  <li><strong>2. Expression — Gathering in the Local Church (Hebrews 10:24-25):</strong> "Not forsaking the assembling of ourselves together." Acts 2:42: the early church was devoted to the apostles' doctrine, fellowship, breaking of bread, and prayers — "steadfastly" (proskarterountes = devoted, persistent). 1 Corinthians 14:26: gathering is participatory — "each one has something to contribute for edification." Online teaching supplements but cannot replace embodied local church life.</li>
  <li><strong>3. Culture — Love, Forgiveness, and Honour (Colossians 3:12-17):</strong> "Put on tender mercies, kindness, humility, meekness, longsuffering; bearing with one another, forgiving one another... above all, love." Romans 12:10: "In honour giving preference to one another." Galatians 6:1-2: restore those overtaken in a trespass in a spirit of gentleness, bearing one another's burdens.</li>
  <li><strong>4. Participation — Serving, Giving, and Making Disciples (1 Peter 4:10-11; Acts 4:32-35):</strong> "As each one has received a gift, minister it to one another." Acts 4:32: "Nor was there anyone among them who lacked." Giving is a family expression of belonging, not a religious duty. Hebrews 13:17: accountability to spiritual leaders — those who watch for your soul.</li>
</ul>
<h3>Key Fellowship Truths</h3>
<ul>
  <li>Church hurt is real — but isolation is not the cure. The answer is a healthier, grace-rooted community, not the rejection of community altogether.</li>
  <li>Growth in Christian maturity is fundamentally communal — Ephesians 4:16: the body grows as each part does its work.</li>
  <li>Philemon 1:6: effective faith-sharing is connected to acknowledging every good thing in us in Christ — community sharpens and activates faith.</li>
</ul>
HTML,
                        'content_text'   => 'Fellowship with other believers is a new-creation reality — not optional. The local church is where the "one another" commands of the New Testament are lived out through devoted gathering, love, forgiveness, and mutual service.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'Devotion',
                        'order_index'    => 9,
                        'duration_minutes' => 60,
                        'scripture_refs' => ['Acts 2:42', 'Romans 8:15-16', 'Romans 12:1-2', 'Hebrews 4:14-16', 'Hebrews 10:19-22', '2 Timothy 2:15', '2 Timothy 3:15-17', 'Colossians 3:16'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 9: Devotion</h2>
<p><em>A Son's Response to a Father's Grace</em></p>
<p>The word "devotion" can carry weight that distorts its true meaning. In a performance-based religious framework, devotion becomes the mechanism by which a believer earns God's attention or maintains their standing. In the New Testament, devotion operates from a completely different foundation. It is not the door to relationship — it is the expression of relationship already secured in Christ.</p>
<p>Hebrews 10:19-22: "Having boldness to enter the Holiest by the blood of Jesus... let us draw near." The access is already established by the blood. Devotion is the drawing near — not to create access, but to enjoy it. It is a son's response to a Father's grace, not a slave's effort to earn a master's approval.</p>
<h3>Four Realities of New Covenant Devotion</h3>
<ul>
  <li><strong>1. Foundation — Finished Work and Sonship:</strong> Romans 8:15: "You received the Spirit of adoption by whom we cry out, 'Abba, Father.'" Galatians 4:6-7: the believer's posture is heir, not slave — familial, not transactional. Hebrews 10:19-22: parrēsia (boldness, confidence, free speech) — the approach of a child to a father. The biggest threat to genuine devotion is the spirit of bondage — approaching God from fear rather than from sonship.</li>
  <li><strong>2. Word Devotion (2 Timothy 2:15; Colossians 3:16):</strong> "Study to show yourself approved" (spoudazō = diligent effort). "Let the word of Christ dwell in you richly" (katoikeō = permanent residence). 2 Timothy 3:16-17: the goal is completeness — thoroughly equipped for every good work. 2 Corinthians 3:18: beholding the Word produces transformation — not information accumulation but Spirit-wrought formation.</li>
  <li><strong>3. Prayer — Participation and Fellowship (Hebrews 4:16; 1 Thessalonians 5:17):</strong> "Come boldly to the throne of grace." "Pray without ceasing" = living in ongoing consciousness of fellowship with God. Jude 1:20-21: praying in the Holy Spirit builds the inner man. Ephesians 3:16-19: the goal of prayer is the experiential knowledge of Christ's love, not accumulation of answered requests.</li>
  <li><strong>4. Fruit — Christ Expressed in Conduct (Romans 12:1; John 15:7):</strong> Devotion produces a life that is an act of worship. "If you abide in Me and My words abide in you, you will ask what you desire and it shall be done." Philemon 1:6: acknowledging Christ's indwelling makes faith-sharing effective. Walk in the Spirit and you shall not fulfil the lust of the flesh (Galatians 5:16).</li>
</ul>
<h3>Key Devotion Notes</h3>
<ul>
  <li>Devotion should be practised with consistency rather than intensity — regular, unhurried engagement is more formative than occasional marathon sessions driven by guilt.</li>
  <li>Devotion to the Word is for formation, not merely information — the goal is that Christ would dwell in the heart through faith (Ephesians 3:17).</li>
  <li>Genuine devotion keeps the believer conscious of their identity in Christ — identity-consciousness produces bold, effective witness.</li>
</ul>
HTML,
                        'content_text'   => 'New Covenant devotion is a son\'s love-response to a Father\'s grace — not earning access but enjoying access already established by Christ\'s blood. Word devotion, prayer, and consistent practice produce formation and fruitfulness.',
                        'is_published'   => true,
                    ],
                    [
                        'title'          => 'The Baptism of the Holy Spirit',
                        'order_index'    => 10,
                        'duration_minutes' => 75,
                        'scripture_refs' => ['Joel 2:28-29', 'John 7:37-39', 'Acts 1:4-8', 'Acts 2:1-18', 'Romans 8:9-16', '1 Corinthians 14:1-5', 'Ephesians 5:18', '1 Thessalonians 5:19'],
                        'content_html'   => <<<'HTML'
<h2>MODULE 10: The Baptism of the Holy Spirit</h2>
<p><em>"But you shall receive power when the Holy Spirit has come upon you; and you shall be witnesses to Me in Jerusalem, and in all Judea and Samaria, and to the end of the earth." — Acts 1:8</em></p>
<p>The giving of the Holy Spirit was the culminating gift of the Father's redemptive purpose, secured by the death, resurrection, and ascension of Christ. John 7:37-39: "He who believes in Me... out of his heart will flow rivers of living water." This He spoke concerning the Spirit, whom those believing would receive — for the Holy Spirit was not yet given because Jesus was not yet glorified.</p>
<p>The foundation of this module is Romans 8:9: "If anyone does not have the Spirit of Christ, he is not His." Every genuine believer has the Holy Spirit. The baptism of the Holy Spirit is not a second-tier experience reserved for an elite — it is the fulfilment of the Father's promise for every member of the body of Christ.</p>
<h3>Four Dimensions of the Baptism of the Holy Spirit</h3>
<ul>
  <li><strong>1. Promise and Provision:</strong> Galatians 3:2, 14: the Spirit is received by the hearing of faith — not by moral achievement, fasting, or emotional intensity. Titus 3:5-6: poured out on us abundantly through Jesus Christ. Luke 24:49: Jesus called the Spirit "the Promise of My Father." Acts 2:32-33: the exalted Christ received the promise from the Father and poured it out.</li>
  <li><strong>2. Union Reality (1 Corinthians 12:13):</strong> "By one Spirit we were all baptized into one body." This is the new birth dimension — every believer is incorporated into Christ. Ephesians 1:13-14: sealed with the Spirit at the moment of believing. Romans 8:9-11: the Spirit is the baseline mark of belonging to Christ.</li>
  <li><strong>3. Empowerment for Witness and Prayer (Acts 1:8; Acts 2:1-4):</strong> Power (dunamis) for witness is the primary purpose. The pattern across Acts 2, 10, and 19 is consistent: those filled with the Spirit spoke in tongues as the Spirit gave utterance. 1 Corinthians 14:4: speaking in tongues edifies the believer personally. 1 Corinthians 14:27-28: public use of tongues in a meeting requires interpretation for the edification of all.</li>
  <li><strong>4. Continuity — From Received to Filled (Ephesians 5:18; 1 Thessalonians 5:19):</strong> "Be filled with the Spirit" — present passive imperative = keep being filled, continuously. Do not quench the Spirit (1 Thessalonians 5:19). Do not grieve the Spirit (Ephesians 4:30). The mature believer maintains ongoing fullness through the Word, prayer in the Spirit (Jude 1:20), and community in the body of Christ.</li>
</ul>
<h3>Key Notes</h3>
<ul>
  <li>Tongues is not a badge of spiritual superiority — 1 Corinthians 13:1 places all gifts under the governance of love.</li>
  <li>John 16:13-14: the Spirit's consistent work is to reveal Christ, not to draw attention to Himself. The measure of Spirit-fullness is Christ-centredness, love, and the fruit of the Spirit.</li>
  <li>Romans 5:5: "The love of God has been poured out in our hearts by the Holy Spirit" — the final expression of the Spirit's work is love.</li>
</ul>
HTML,
                        'content_text'   => 'The Holy Spirit is received by faith, not striving — He is God\'s promise poured out through Christ. Every believer is indwelt, and ongoing Spirit-fullness (Ephesians 5:18) is maintained through the Word, prayer, and yieldedness.',
                        'is_published'   => true,
                    ],
                ],
            ],
        ];

        foreach ($courses as $courseData) {
            $modules = $courseData['modules'];
            unset($courseData['modules']);

            $course = Course::firstOrCreate(
                ['title' => $courseData['title']],
                array_merge($courseData, ['created_by' => $admin?->id])
            );

            foreach ($modules as $moduleData) {
                Module::firstOrCreate(
                    ['course_id' => $course->id, 'order_index' => $moduleData['order_index']],
                    $moduleData
                );
            }

            $this->command->info("Seeded: {$course->title} (" . count($modules) . " modules)");
        }
    }
}
