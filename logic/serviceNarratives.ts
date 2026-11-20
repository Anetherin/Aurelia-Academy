
import { Student, PerformanceTier } from '../types';

interface ServiceResult {
  tier: PerformanceTier;
  revenue: number;
  tip: number;
  narrative: string;
  type: 'tier_fail' | 'tier_poor' | 'tier_decent' | 'tier_good' | 'tier_excellent';
}

const TIER_CONFIG: Record<PerformanceTier, { multiplier: number, tipMult: number, logType: ServiceResult['type'] }> = {
  Fail: { multiplier: 0, tipMult: 0, logType: 'tier_fail' },
  Poor: { multiplier: 0.5, tipMult: 0.2, logType: 'tier_poor' },
  Decent: { multiplier: 1.0, tipMult: 1.0, logType: 'tier_decent' },
  Good: { multiplier: 2.0, tipMult: 2.5, logType: 'tier_good' },
  Excellent: { multiplier: 3.5, tipMult: 6.0, logType: 'tier_excellent' }
};

type NarrativeSet = Record<PerformanceTier, string[]>;

interface ServiceTemplate {
  customer: NarrativeSet;
  student: NarrativeSet;
}

// Complete the SERVICE_TEMPLATES and fix the missing 'student' property error
export const SERVICE_TEMPLATES: Record<string, ServiceTemplate> = {
  massage: {
    customer: {
      Fail: [
        "{name} was clumsy and clinical, her hands cold and her movements jerky. The patron got frustrated by her lack of care, complaining that it felt more like a medical exam than a service, and he left without paying.",
        "{name} accidentally spilled an entire bottle of ice-cold oil onto the patron's back, causing him to yelp in shock. She spent the rest of the session awkwardly trying to towel him off while apologizing, ruining the mood completely.",
        "{name}'s hands were shaking so violently that she couldn't apply any consistent pressure to his muscles. The patron finally sat up, annoyed by her nervousness, and told her to just stop before storming out."
      ],
      Poor: [
        "The client found {name}'s touch amateurish, as she simply rubbed oil around without working the muscles. When he asked her to touch his lower back, she recoiled visibly, leading him to toss a meager ${tip} pity-tip.",
        "{name} seemed entirely distracted, staring out the window while one hand lazily circled the patron's shoulder. The massage lacked any heat or intimacy, and the patron left a bare-minimum ${tip} just to be polite.",
        "{name} provided a functional rubdown, but her body language was stiff and she refused to make eye contact. The patron felt like a burden rather than a client, leaving a small ${tip} before hurrying out."
      ],
      Decent: [
        "{name} provided a steady, sensual oil massage, her soft palms working firmly over the knots in the patron's shoulders. She leaned close enough for him to smell her perfume, creating a relaxing atmosphere that earned her a ${tip} tip.",
        "{name} worked the tension out of the patron's thighs, her fingers teasingly grazing his inner leg with warm oil. She kept a professional but warm smile, ensuring he was relaxed enough to leave a solid ${tip}.",
        "Using plenty of warm aromatic oil, {name} slid her hands in long, sweeping strokes over the patron's chest and stomach. Her rhythm was soothing, and the patron groaned in relief, handing over ${tip}."
      ],
      Good: [
        "{name} stripped down to her sheer lace lingerie and pressed her chest against the patron's back. He could feel her nipples hardening through the fabric as she used her body weight to knead his muscles, earning a ${tip} tip.",
        "{name} straddled the patron's hips, grinding the wet heat of her crotch against his lower back while she massaged his neck. The friction of her body against his skin drove him wild, and he happily paid ${tip}.",
        "The session turned into a slippery body-slide, with {name} using her oiled forearms and breasts to slide up and down the patron's spine. She whispered dirty things in his ear as she worked, ensuring he left a generous ${tip}."
      ],
      Excellent: [
        "{name} delivered an erotic masterclass, stripping completely naked and covering herself in slick oil. She slid her entire body over the patron like a second skin, her breasts and thighs stimulating every inch of him until he left a massive ${tip}.",
        "Naked and glistening, {name} performed a perfect Nuru massage, sandwiching the patron's cock between her slippery thighs while massaging his chest. He exploded from the friction alone, trembling as he handed over ${tip}.",
        "{name} used her body as a living instrument of pleasure, sliding her wet pussy over the patron's neck and back while her hands worked his legs. The sensory overload left the patron gasping for air and emptying his wallet with a ${tip} tip."
      ]
    },
    student: {
      Fail: [
        "{name} felt completely out of her depth, her mind racing with panic every time skin touched skin. She just wanted to run out of the room.",
        "{name} felt a wave of nausea and couldn't stop her hands from trembling, terrified she was doing everything wrong.",
        "{name} was so overwhelmed by the intimacy that she froze, unable to remember a single technique she had practiced."
      ],
      Poor: [
        "{name} tried her best to go through the motions, but she felt incredibly awkward and exposed. She spent the whole time counting down the seconds.",
        "{name} felt stiff and uncoordinated, constantly worrying that the patron could tell she didn't want to be there.",
        "{name} kept her eyes averted, trying to dissociate from the feeling of the stranger's skin under her hands."
      ],
      Decent: [
        "{name} managed to maintain a professional veneer, focusing purely on the muscle tension to distract herself. It wasn't enjoyable, but she could handle it.",
        "{name} found a soothing rhythm in the work, letting her mind wander to safer places while her hands did the job.",
        "{name} felt a small sense of accomplishment in knotting out the tension, even if she felt no sexual spark."
      ],
      Good: [
        "{name} felt a sudden, surprising flicker of arousal as she felt the patron's muscles relax under her touch. She found herself leaning in closer than necessary.",
        "{name} enjoyed the feeling of his hot skin on hers, realizing she liked the power she had to make him groan.",
        "{name} felt her own body reacting to the friction, her nipples hardening as she pressed against his back."
      ],
      Excellent: [
        "{name} was lost in the primal rhythm of the service, her body moving on instinct as she sought her own friction against him.",
        "{name} felt an electric charge with every body slide, her pussy getting wet as she realized how much she enjoyed the contact.",
        "{name} was as breathless as the patron by the end, her skin tingling and alive with a newfound lust."
      ]
    }
  },
  manual: {
    customer: {
      Fail: [
        "{name}'s grip was far too tight and aggressive, treating the sensitive organ like a piece of rope. The session ended with the patron in pain and pulling away, refusing to pay for the rough handling.",
        "{name} refused to touch him directly, trying awkwardly to use a towel as a barrier. The patron was insulted by her obvious disgust and stormed out of the room immediately.",
        "{name} hesitated so long that the patron lost his erection completely. When she finally reached for him, her hands were clammy and cold, and he left in a huff."
      ],
      Poor: [
        "{name} was clearly hesitant, her hand-work lacklustre and dry as she tugged at him without any rhythm. The patron finished eventually, but he was annoyed by the chafing and left a small ${tip}.",
        "{name} just went through the motions, staring blankly at the wall while she jerked him off like she was churning butter. He finished quickly just to get it over with, leaving ${tip}.",
        "The grip was inconsistent—too loose then too tight—and the pacing was all over the place. {name} managed to get him off, but the lack of care resulted in a meager ${tip}."
      ],
      Decent: [
        "{name} used a rhythmic, steady motion with plenty of lotion, her eyes occasionally meeting his. It wasn't mind-blowing, but it was a solid release that earned her a ${tip} tip.",
        "{name} knew the basics well, using a firm grip to stroke the full length of his shaft. She listened to his breathing to adjust her speed, and he grunted his thanks with a ${tip} tip.",
        "{name} teased the sensitive tip with her thumb while stroking the shaft with her other fingers. The sensation was pleasant enough to elicit a satisfied sigh and a ${tip} tip."
      ],
      Good: [
        "{name} was enthusiastic, her eyes locked on the patron's face as she worked him with a slick, fast rhythm. She used her other hand to fondle his balls, making him shudder and pay ${tip}.",
        "{name} sat between his legs and used both hands, twisting and milking the shaft while teasing his perineum. The dual stimulation was too much to handle, and he paid ${tip} with a smile.",
        "{name} spat thickly into her palm and worked him with a sloppy, wet grip that sounded obscene. The wet, slapping noises drove him crazy, and he curled his toes as he left ${tip}."
      ],
      Excellent: [
        "{name} was a blur of expert motion, bringing the patron to the edge of orgasm and stopping repeatedly. She edged him until he was begging, finally milking out a massive load and earning a ${tip} tip.",
        "{name} maintained intense, lusty eye contact, licking her lips as she stroked him to a violent, twitching climax. She didn't stop when he fired, milking every last drop until he dropped ${tip}.",
        "{name} used a complex twisting technique with a grip of iron, stimulating the most sensitive nerves. She controlled his orgasm completely, forcing him to erupt harder than he ever had, earning a huge ${tip}."
      ]
    },
    student: {
      Fail: [
        "{name} was visually repulsed by the contact, feeling a strong urge to wash her hands immediately. She couldn't hide her disgust.",
        "{name} felt her stomach turn and couldn't bring herself to look at the erection, staring at the floor in panic.",
        "{name} was paralyzed by the thought of touching him there, her hands freezing in mid-air."
      ],
      Poor: [
        "{name} kept her eyes averted, trying to dissociate from the action and pretend she was somewhere else entirely.",
        "{name} felt bored and detached, wondering how long it would take for him to just finish so she could leave.",
        "{name} treated the act like a mechanical chore, feeling absolutely nothing but a desire for it to be over."
      ],
      Decent: [
        "{name} focused intently on her technique to pass the time, treating it like a puzzle to be solved rather than a sexual act.",
        "{name} was relieved that she could control the pace, finding a rhythm that worked even if she wasn't aroused.",
        "{name} watched his reaction to gauge her performance, satisfied that she was doing a competent job."
      ],
      Good: [
        "{name} enjoyed the feeling of control she had, watching him squirm and gasp under the movement of her hand.",
        "{name} felt a rush of heat watching him grow hard in her grip, realizing she liked the visual aspect of the service.",
        "{name} found herself mesmerized by the fluids and the heat, her own breath catching as he got close to the edge."
      ],
      Excellent: [
        "{name} took a strange pride in her technique, loving the feeling of milking him dry and seeing him lose composure.",
        "{name} felt a sadistic thrill at edging him, realizing she held his total pleasure in the palm of her hand.",
        "{name} was fascinated by the explosive finish, feeling a surge of triumph as he emptied himself for her."
      ]
    }
  },
  oral: {
    customer: {
      Fail: [
        "{name} gagged immediately as soon as he tried to enter her mouth, retching loudly and ruining the mood entirely. The patron pulled away in disgust and left.",
        "{name} accidentally scraped the sensitive head of his cock with her teeth, causing the patron to yell out in pain. He pushed her head away and refused to continue.",
        "{name} refused to open her mouth wide enough, barely letting the tip pass her lips. The patron got frustrated with the lack of effort and left without paying."
      ],
      Poor: [
        "{name} was far too cautious, her technique clumsy and hesitant as she avoided taking him deep. He patted her head patronizingly and left a small ${tip}.",
        "{name} bobbed her head mechanically, but her tongue was lifeless and she refused to make eye contact. The patron finished, but it was a boring experience that only warranted ${tip}.",
        "{name} slobbered messily all over him but lacked any real suction or rhythm. It was wet but underwhelming, and the patron left a meager ${tip}."
      ],
      Decent: [
        "{name} was thorough and obedient, following his instructions to lick and suck. She didn't take it too deep, but her enthusiasm was enough to earn a ${tip} tip.",
        "{name} wrapped her lips tight around the head, using her tongue to tease the sensitive frenulum underneath. She kept a steady bobbing rhythm that he enjoyed, earning ${tip}.",
        "{name} maintained a steady suction, her hand working the base of his shaft while she sucked on the head. It was a classic, well-executed service that he rewarded with ${tip}."
      ],
      Good: [
        "{name} showed remarkable talent, her tongue swirling around the head with expert precision while she took him deeper. She looked up at him with wet, eager eyes, earning a ${tip} tip.",
        "{name} took him deep into her throat, relaxing her muscles to hug his length while she hummed against his cock. The vibration drove him over the edge, and he paid ${tip}.",
        "{name} let spit drool from her lips as she worked him, making sloppy, obscene noises that turned him on immensely. She swallowed the pre-cum eagerly, ensuring a ${tip} tip."
      ],
      Excellent: [
        "{name} was a revelation, her throat seemingly bottomless as she took him to the hilt without gagging. She deep-throated him vigorously, her nose buried in his pubic hair, earning a massive ${tip}.",
        "{name} drained the patron completely, drinking every drop of his load with a filthy smile before cleaning him off with her tongue. He gasped, legs shaking, and dropped ${tip}.",
        "{name} practically face-fucked herself on the patron's cock, letting him grab her hair and use her mouth like a sleeve. She took everything he gave her and begged for more, earning ${tip}."
      ]
    },
    student: {
      Fail: [
        "{name} struggled violently with her gag reflex, feeling panic rise in her chest as her throat closed up.",
        "{name} felt sick to her stomach, the taste and texture overwhelming her senses until she had to pull away.",
        "{name} couldn't breathe and panicked, her eyes watering as she desperately tried to disengage."
      ],
      Poor: [
        "{name} felt a wave of deep shame, closing her eyes tight and wishing she could disappear into the floor.",
        "{name} just wanted him to finish, counting the strokes in her head and trying to ignore the taste.",
        "{name} tried to think of anything else—her homework, her grocery list—anything to detach from the act."
      ],
      Decent: [
        "{name} focused entirely on the task at hand, treating it as a job that needed to be done well.",
        "{name} concentrated on not using her teeth, finding satisfaction in her ability to follow his commands.",
        "{name} accepted the taste and texture, realizing it wasn't as bad as she feared if she just kept a rhythm."
      ],
      Good: [
        "{name} found she liked the taste of the patron's pleasure, feeling a thrill when she heard him moan above her.",
        "{name} felt proud of how deep she could take it, enjoying the shocked look on his face when she didn't gag.",
        "{name} enjoyed the wet, sloppy sounds, feeling like a dirty girl in the best possible way."
      ],
      Excellent: [
        "{name} found herself craving the completion, eagerly anticipating the warm rush down her throat.",
        "{name} loved the feeling of being filled up, her head emptying of all thoughts except serving the cock.",
        "{name} felt a primal, submissive satisfaction in swallowing, feeling like she truly belonged on her knees."
      ]
    }
  },
  vaginal: {
    customer: {
      Fail: [
        "{name} froze up completely at the last second, pushing the patron away and curling into a ball. He tried to coax her, but she was unresponsive, so he dressed and left.",
        "{name} was so dry and clamped shut that the patron couldn't even enter her. The friction was painful for both of them, and he left in frustration without finishing.",
        "{name} started crying silently as soon as he touched her thighs, killing the mood instantly. The patron felt like a monster and left immediately."
      ],
      Poor: [
        "{name} was tight and unresponsive, lying there like a starfish while he did all the work. It was like fucking a mannequin, and he left a small ${tip} out of pity.",
        "{name} stared blankly at the ceiling the entire time, offering no movement or sound. The patron finished quickly just to end the awkwardness, leaving ${tip}.",
        "{name} was visibly uncomfortable, wincing every time he thrust deeper. The sex was mechanical and dry, and he tossed ${tip} before leaving."
      ],
      Decent: [
        "{name} was warm and welcoming, spreading her legs and providing a standard but solid service. She met his thrusts with small movements, earning a ${tip} tip.",
        "{name} wrapped her legs around the patron's waist, pulling him deeper and moaning softly in his ear. It was a convincing performance that he rewarded with ${tip}.",
        "{name} rode the patron with a steady, bouncing rhythm, her breasts jiggling softly as she worked to get him off. He finished with a groan and left ${tip}."
      ],
      Good: [
        "{name} was incredibly active, her hips moving in a feverish dance that milked his cock with every thrust. She scratched his back and whispered for him to go harder, earning a ${tip} tip.",
        "{name} clamped her internal muscles around him, squeezing his cock rhythmically while she rode him. The sensation was incredible, and he groaned loudly before paying ${tip}.",
        "{name} hooked her legs over his shoulders, opening herself completely and begging for his seed. The view and the tightness were top-tier, and he left ${tip}."
      ],
      Excellent: [
        "{name} was a goddess of pleasure, her walls pulsing in perfect sync with the patron's thrusts. She matched his animalistic energy, screaming his name as they climaxed together, earning ${tip}.",
        "{name} took a massive, warm creampie, holding his hips against her so he couldn't pull out. She lay there afterwards, legs quivering and dripping, smiling as he dropped ${tip}.",
        "{name} rode his face until she soaked him, then immediately impaled herself on his cock. She bounced frantically, eyes rolled back, milking him dry until he left a huge ${tip}."
      ]
    },
    student: {
      Fail: [
        "{name} couldn't bring herself to do it, her body locking down in a total rejection of the act.",
        "{name} felt terrified of the intrusion, her heart hammering so hard she thought she might faint.",
        "{name} felt a crushing weight on her chest and couldn't breathe, forcing her to stop everything."
      ],
      Poor: [
        "{name} felt used and hollow, staring at a crack in the ceiling and waiting for the weight to get off her.",
        "{name} felt numb, dissociating completely so she wouldn't have to feel the friction inside her.",
        "{name} counted the ceiling tiles, trying to calculate how many seconds were left until he was done."
      ],
      Decent: [
        "{name} accepted her role with resignation, focusing on the physical sensations rather than the emotional weight.",
        "{name} focused on pleasing him, finding that making fake moans actually helped her get into the rhythm.",
        "{name} found the repetitive motion somewhat comforting, allowing her to zone out while her body worked."
      ],
      Good: [
        "{name} was surprised by her own heat, feeling her body betray her mind as she started to grind back.",
        "{name} felt her walls swelling with pleasure, realizing she needed the friction just as much as he did.",
        "{name} got lost in the sweat and the noise, feeling a rush of endorphins as he hit the right spot."
      ],
      Excellent: [
        "{name} surrendered completely to the lust, her mind going blank as she became nothing but a vessel for his pleasure.",
        "{name} felt an aching emptiness when he finally pulled out, immediately craving to be filled up again.",
        "{name} was addicted to the feeling of being bred, feeling a deep, primal satisfaction in taking his load."
      ]
    }
  },
  anal: {
    customer: {
      Fail: [
        "{name} was too terrified, shaking so badly that she couldn't relax. The attempt ended in tears and a very awkward conversation, with the patron leaving unpaid.",
        "{name} clamped her sphincter shut so tightly that the patron couldn't even get a finger in. After several painful attempts, he gave up and left.",
        "{name} panicked at the first feeling of stretching, kicking the patron away instinctively. The mood was shattered, and he stormed out."
      ],
      Poor: [
        "{name} was extremely tense, gritting her teeth and wincing through the entire encounter. It made the experience difficult and guilt-inducing for the patron, who left a small ${tip}.",
        "{name} required so much prep and coaxing to take just the tip that the patron barely had time to finish. He was frustrated by the delay and tossed ${tip}.",
        "{name} lay face down in the pillow, sobbing quietly while he worked. The patron finished quickly just to stop the noise, leaving a pity ${tip}."
      ],
      Decent: [
        "{name} was submissive and endured the encounter with quiet grace, breathing through the initial stretch. She relaxed enough to let him establish a rhythm, earning a ${tip} tip.",
        "{name} lay back and pulled her knees to her chest, exposing herself fully. She whimpered softly as he entered but took him all the way, earning ${tip}.",
        "{name} let the patron set the pace, her body rocking with his thrusts. She was tight, but accomodating enough to provide a good service, and he left ${tip}."
      ],
      Good: [
        "{name} was surprisingly receptive, arching her back and pushing her ass back onto him. She moaned in genuine pleasure as he hit her prostate, earning a ${tip} tip.",
        "{name} was incredibly tight and wet, her ass clutching his cock perfectly with every thrust. She looked back at him with a dirty smile, causing him to groan and pay ${tip}.",
        "{name} presented her ass eagerly, spreading her cheeks for him. She gasped and drooled as he pounded her, taking the rough treatment like a pro and earning ${tip}."
      ],
      Excellent: [
        "{name} was a master of submission, her most private depths providing him with unparalleled ecstasy. She gaped beautifully for him, taking his full length and asking for more, earning ${tip}.",
        "{name} took him fully, engaging in a rough, fast-paced pounding that had her ass clapping loudly. She milked his prostate with her internal muscles, forcing a massive load and a huge ${tip}.",
        "{name} was insatiable, grinding back onto him until he dumped his load deep inside her guts. She stayed gaped open afterwards, showing him the damage he'd done, and he happily dropped ${tip}."
      ]
    },
    student: {
      Fail: [
        "{name} was overwhelmed by fear, the sensation of invasion feeling like a knife. She couldn't handle it.",
        "{name} felt like she was tearing apart, the pain far outweighing any potential pleasure or duty.",
        "{name} couldn't relax her muscles no matter how hard she tried, her body rejecting the act entirely."
      ],
      Poor: [
        "{name} felt a deep sense of violation, burying her face in the pillow to hide her grimace.",
        "{name} just wanted the burning pain to stop, focusing entirely on enduring the next few minutes.",
        "{name} felt dirty and degraded, feeling like she was being used in the worst possible way."
      ],
      Decent: [
        "{name} focused intently on her breathing, using yoga techniques to relax into the massive stretch.",
        "{name} tried to find a space of submissive quiet in her mind, letting her body become an object for him.",
        "{name} found the fullness distracting but manageable, focusing on the rhythm to get through it."
      ],
      Good: [
        "{name} found a strange, intense pleasure in the fullness, feeling him rub against spots she didn't know existed.",
        "{name} felt full in a way she'd never experienced, enjoying the feeling of being completely possessed.",
        "{name} loved how losing control felt, the intensity of the stretch silencing all her chaotic thoughts."
      ],
      Excellent: [
        "{name} was completely broken to the patron's will, feeling a euphoric high from the intense stretching.",
        "{name} felt like a true slut, loving the degradation and the feeling of him deep inside her guts.",
        "{name} felt a rush of heat every time he bottomed out, addicted to the feeling of being used so thoroughly."
      ]
    }
  }
};

/**
 * Calculates the result of a service interaction.
 * Fixes App.tsx import error by exporting this function.
 */
export const calculateServiceResult = (
  student: Student, 
  serviceType: string, 
  baseRevenue: number, 
  clubLevel: number
): ServiceResult => {
  const skills = student.skills;
  let relevantSkill = 0;

  // Determine skill based on service type
  switch (serviceType) {
    case 'massage': relevantSkill = skills.massage; break;
    case 'manual': relevantSkill = skills.manual_service; break;
    case 'oral': relevantSkill = skills.oral_service; break;
    case 'vaginal': relevantSkill = skills.vaginal_service; break;
    case 'anal': relevantSkill = skills.anal_service; break;
    default: relevantSkill = skills.massage;
  }

  // Calculate score based on skills and aptitudes
  const performanceScore = (relevantSkill * 0.6) + (skills.seduction * 0.2) + (skills.compliance * 0.1) + (student.aptitudes.libido * 0.1);
  const roll = Math.random() * 20 - 10; // -10 to +10 randomness
  const finalScore = performanceScore + roll + (clubLevel * 5);

  // Determine tier
  let tier: PerformanceTier = 'Fail';
  if (finalScore >= 85) tier = 'Excellent';
  else if (finalScore >= 65) tier = 'Good';
  else if (finalScore >= 40) tier = 'Decent';
  else if (finalScore >= 20) tier = 'Poor';

  const config = TIER_CONFIG[tier];
  const revenue = Math.floor(baseRevenue * config.multiplier);
  const baseTip = (baseRevenue * 0.2) + (student.skills.seduction * 5);
  const tip = Math.floor(baseTip * config.tipMult * (0.8 + Math.random() * 0.4));

  const templates = SERVICE_TEMPLATES[serviceType] || SERVICE_TEMPLATES.massage;
  const pool = templates.customer[tier];
  let narrative = pool[Math.floor(Math.random() * pool.length)];
  
  // Replace placeholders in narrative
  narrative = narrative.replace(/{name}/g, student.name).replace(/\${tip}/g, `$${tip.toLocaleString()}`);

  return {
    tier,
    revenue,
    tip,
    narrative,
    type: config.logType
  };
};
