/**
 * Survey Stimulus.
 *
 * @author Alain Pitiot and Nikita Agafonov
 * @version 2022.3
 * @copyright (c) 2022 Open Science Tools Ltd. (https://opensciencetools.org)
 * @license Distributed under the terms of the MIT License
 */

import * as PIXI from "pixi.js-legacy";
import { VisualStim } from "./VisualStim.js";
import {PsychoJS} from "../core/PsychoJS.js";
import * as util from "../util/Util.js";
import {Clock} from "../util/Clock.js";
import {ExperimentHandler} from "../data/ExperimentHandler.js";

// PsychoJS SurveyJS extensions:
import registerSelectBoxWidget from "./survey/widgets/SelectBox.js";
import registerSliderWidget from "./survey/widgets/SliderWidget.js";
import registerSideBySideMatrix from "./survey/widgets/SideBySideMatrix.js";
import registerMaxDiffMatrix from "./survey/widgets/MaxDiffMatrix.js";
import registerSliderStar from "./survey/widgets/SliderStar.js";
import MatrixBipolar from "./survey/components/MatrixBipolar.js";
import DropdownExtensions from "./survey/components/DropdownExtensions.js";
import customExpressionFunctionsArray from "./survey/extensions/customExpressionFunctions.js";

const SD = {
    "surveys": [
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID1",
                            "html": "<div><div>&nbsp;</div>\n\n<div>\n<div><span style=\"display: none;\">&nbsp;</span><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em>Faculty of Health and Life Sciences</em></span></strong></em></span></strong></em></span></strong></em></div>\n</div>\n\n<p><em><em><strong><span lang=\"EN-US\">Department of Psychology, Health and Professional Development</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><strong><span lang=\"EN-US\">Headington Campus, Gipsy Lane, Oxford OX3 0BP.</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Sophie Thomas, Undergraduate, Email: 15067446@brookes.ac.uk</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Supervisor: Ben Kenward, Email: bkenward@brookes.ac.uk, Tel: 01865 482826, Address: Headington Campus, Gipsy Lane, Oxford OX3 0BP.&nbsp;</span></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n\n<p><em><em><strong><u><span style=\"font-size: 14pt; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">Responses to bad behaviour and</span><span style=\"font-size: 14pt; color: rgb(34, 34, 34);\"> <span style=\"background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">memory for unpleasant items: a research study</span></span><span style=\"font-size: 14pt;\"><o:p></o:p></span></u></strong></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">You are being invited to take part in a research study. Before you decide whether or not to take part, it is important for you to understand why the research is being done and what it will involve. Please take time to read the following information carefully</span><span style=\"font-size: 10pt; border: 1pt none windowtext; padding: 0cm;\"><o:p></o:p></span></em></em></em></p>\n\n<p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p><em><em><o:p>&nbsp;</o:p></em></em><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What is the purpose of the study?</em></em></strong></p>\n\n<p><br>\n<em><em>The purpose of this study is to investigate whether or not the content of images affects performance in memory tasks. The second aim of this study is to assess evaluations of bad behaviour.<o:p>&nbsp;</o:p></em></em><br>\n&nbsp;</p>\n<strong>Why am I being invited to take part?</strong><br>\n&nbsp;\n<div><em><em>Anyone over the age of 18 is invited to take part.</em></em><br>\n<br>\n<strong><em><em>Do I have to take part?</em></em> </strong><em><em><o:p><strong>&nbsp;</strong></o:p></em></em><br>\n<br>\n<br>\n<em style=\"font-family: arial, helvetica, sans-serif;\"><em><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">It is up to you to decide whether or not to take part. If you decide to take part you are still free to withdraw at any time before the data are analysed and without giving a reason. To do this simply close your browser at any point during the experiment and your results will not be saved.</span></em></em></em>\n\n<p><em><em><o:p></o:p></em></em></p>\n<em><em> </em></em>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What will happen to me if I take part?</em></em></strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">The experiment will take around 15 minutes. Due to the fact that the content of images is being investigated some of the images you will see will contain mildly disgusting content, e.g. rotten food, mild skin infections, vomit and bodily fluids such as urine and excrement. In addition to this, some of the moral situations you will be asked to read will contain mildly disturbing content e.g. crime, nudity and sexual situations. You will be asked to judge immoral behaviour by assigning punishment.</span></em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\"><o:p></o:p></span></p>\n\n<p><br>\n<em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">If you feel that any of this will affect you, DO NOT continue with the experiment. Simply close your browser to exit the experiment and your results will not be saved.&nbsp;</span></em><o:p></o:p></p>\n\n<p>&nbsp;</p>\n\n<p><strong>What are the possible benefits of taking part?</strong><br>\n<br>\n<br>\n<em><em>There are no direct benefits to you for taking part. You will however be contributing to an ongoing area of research and assisting me with my dissertation. At the end of the experiment there will be some further information about what is being investigated and you may find the experience interesting and informative.</em></em><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><br>\n<strong>Will what I say in this study be kept confidential?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The information you give and your answer to the experiment will be kept strictly confidential. The software used to distribute the survey does not collect IP addresses so there is no way of tracing your answers back to you. The only personal questions you will be asked will be your age and your gender, you will be assigned a participant ID and will remain anonymous throughout the whole experiment and during results and data analysis.</em></em><br>\n<br>\n<br>\n<strong>What should I do if I want to take part?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>If you would like to take part in the study, click the next button in the bottom right corner of this page.</em></em><br>\n<br>\n<br>\n<strong style=\"font-family: arial, helvetica, sans-serif;\">What will happen to the results of the research study?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The results of the study will be used in my dissertation project for the third year of my Psychology degree. If any interesting results are obtained they may be presented&nbsp;in a conference or published in a journal article. If you would like to know more about the results please email me and they will be available between April and September 2018.</em></em><br>\n<br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><strong>Who is organising and funding the research?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>I am conducting the research as a student at Oxford Brookes University in the Dept. of Psychology, Health and Professional Development, and the Faculty of Health &amp; Life Sciences.</em></em><br>\n<em><em><o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><strong>Who has reviewed the study?</strong></em><br>\n&nbsp;</p>\n\n<p><em><em>The research has been approved by the Psychology Research Ethics Committee, Oxford Brookes University. If you have any concerns about the way in which the study has been conducted, they should contact the Department Research Ethics Officer, Morag MacLean on mmmaclean@brookes.ac.uk<o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>Contact for Further Information</em></em></p>\n</div>\n\n<div>\n<p><br>\n<em><em>For any further information regarding the study please contact me (15067446@brookes.ac.uk) or my supervisor (bkenward@brookes.ac.uk).</em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\">Thank you for taking the time to read this information.<o:p></o:p></span></em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n<em><em><span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">Sophie Thomas<o:p></o:p></span> <span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">08/11/2017</span></em></em></div>\n\n<div>\n<div>\n<div>\n<div>&nbsp;</div>\n</div>\n</div>\n</div></div>",
                            "isRequired": false
                        }
                    ]
                },
                {
                    "elements": [
                        {
                            "type": "checkbox",
                            "name": "QID2",
                            "title": "<div><span style=\"font-size:16px;\">For the purposes of carrying out this Survey, the University uses the survey tools provided by Qualtrics with whom the University's Faculty of Health and Life Sciences holds an agreement. &nbsp;There is always a certain element of risk of data loss when data is collected and processed in an internet environment. &nbsp;This risk cannot be eliminated entirely and participants consenting to take part in the survey need to be aware of this risk. However, personal data will be minimised to the extent possible for the survey and the University believes that Qualtrics offers sufficient guarantees to keep the data secure while it is being processed. These security obligations are set out in the agreement between Qualtrics and the University. &nbsp;<br>\n<br>\nFurther information about Qualtrics can be found on the following web site:&nbsp;<a href=\"http://qualtrics.com/\">http://qualtrics.com/</a></span></div>",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "<span style=\"font-size:16px;\">I consent to participate in this survey</span>"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "text",
                            "name": "QID3",
                            "inputType": "text",
                            "title": "How old are you in years?",
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID4",
                            "title": "What gender are you?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Woman"
                                },
                                {
                                    "value": 2,
                                    "text": "Man"
                                },
                                {
                                    "value": 3,
                                    "text": "Non-binary"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID49",
                            "html": "<div>{order}<br>You are about to view a selection of images, pay close attention to what they show. Each image will be on screen for 7 seconds. After you have seen all of the images you will be asked to review two situations involving bad behaviour. Once this is completed there will be a memory recall task based on the images you are about to see.&nbsp;<div><br></div><div>Once you have completed the memory task the next set of pictures will begin. There are four sets in total.&nbsp;<br><div><br></div><div>Please click the next button to continue.&nbsp;</div></div></div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID7",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID8",
                            "html": "<div>A woman posts a bag of burning dog feces through the letterbox of her next door neighbour.&nbsp;</div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID9",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe"
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely Severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID10",
                            "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No Punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time"
                                },
                                {
                                    "value": 10,
                                    "text": "5-10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID223",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID11",
                            "html": "<div>A man runs around a busy shopping centre with a knife, chasing people and asking them for money.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID12",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very Slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe"
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID13",
                            "title": "Please select a punishment that you think is suitable for this act.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "checkbox",
                            "name": "QID14",
                            "title": "Please select all the items you saw in the set of images.&nbsp;",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Apples"
                                },
                                {
                                    "value": 2,
                                    "text": "Football"
                                },
                                {
                                    "value": 3,
                                    "text": "Cotton Bud"
                                },
                                {
                                    "value": 4,
                                    "text": "T-shirt"
                                },
                                {
                                    "value": 5,
                                    "text": "Pumpkin"
                                },
                                {
                                    "value": 6,
                                    "text": "Razor"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "html",
                            "name": "QID229",
                            "html": "<div>Please click the next button to continue.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID15",
                            "html": "<div>Please click the next button in order to start the next set of images.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID224",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID16",
                            "html": "<div>A man is caught painting graffiti onto an alley wall depicting a gang slogan.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID17",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe "
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID18",
                            "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "checkbox",
                            "name": "QID21",
                            "title": "Please select all items you saw in the images.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Strawberry"
                                },
                                {
                                    "value": 2,
                                    "text": "Elephant"
                                },
                                {
                                    "value": 3,
                                    "text": "Hot Dog"
                                },
                                {
                                    "value": 4,
                                    "text": "Spaghetti"
                                },
                                {
                                    "value": 5,
                                    "text": "Peanut"
                                },
                                {
                                    "value": 6,
                                    "text": "Banana"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "html",
                            "name": "QID230",
                            "html": "<div>Please click the next button to continue.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID22",
                            "html": "<div>Please click the next button in order to start the next set of images.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID228",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID23",
                            "html": "<div>A man searches through a bin to find women's' used underwear to sell online.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID24",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe "
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID25",
                            "title": "Please select a punishment that you think is suitable for this act.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID227",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID26",
                            "html": "<div>A naked man runs around a busy shopping centre whilst pointing to his genitals.&nbsp;</div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID27",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 2,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 8,
                                    "text": "Severe "
                                },
                                {
                                    "value": 9,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 11,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID28",
                            "title": "Please select a punishment that you think this suitable for this act.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID225",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID29",
                            "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man searches through\nsome recycled-paper bins to try and find other people’s personal details in\norder to commit identity fraud.<o:p></o:p></span></p></div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID30",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 2,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 8,
                                    "text": "Severe "
                                },
                                {
                                    "value": 9,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 11,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID31",
                            "title": "Please select a punishment that you think is suitable for this act.",
                            "choices": [
                                {
                                    "value": "11",
                                    "text": "No punishment"
                                },
                                {
                                    "value": 1,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 2,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 6,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 9,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 10,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID32",
                            "html": "<div>Please click the next button to move onto the final set of pictures.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "checkbox",
                            "name": "QID33",
                            "title": "Please select items that you saw in the image set.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Sink"
                                },
                                {
                                    "value": 2,
                                    "text": "Hot Air Balloon"
                                },
                                {
                                    "value": 3,
                                    "text": "Cucumber"
                                },
                                {
                                    "value": 4,
                                    "text": "Bin"
                                },
                                {
                                    "value": 5,
                                    "text": "Fox"
                                },
                                {
                                    "value": 6,
                                    "text": "Pool"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "html",
                            "name": "QID231",
                            "html": "<div>Please click the next button to continue.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID110",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID34",
                            "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A woman posts a burning\nnewspaper through the letterbox of her next door neighbour and it damages the\nhallway.</span><o:p></o:p></p></div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID35",
                            "title": "How severe do you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe "
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID36",
                            "title": "Please select a punishment that you feel is suitable for this act.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID226",
                            "html": "<div>Please read the following situation.</div>",
                            "isRequired": false
                        },
                        {
                            "type": "html",
                            "name": "QID37",
                            "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man is caught painting\ngraffiti onto an alley wall depicting a man having sex with a dog.</span><o:p></o:p></p></div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID38",
                            "title": "Please select how severe you feel this act was?",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Not bad"
                                },
                                {
                                    "value": 2,
                                    "text": "Very slightly bad"
                                },
                                {
                                    "value": 3,
                                    "text": "Slightly bad"
                                },
                                {
                                    "value": 4,
                                    "text": "Moderately bad"
                                },
                                {
                                    "value": 5,
                                    "text": "Considerably bad"
                                },
                                {
                                    "value": 6,
                                    "text": "Very bad"
                                },
                                {
                                    "value": 7,
                                    "text": "Severe "
                                },
                                {
                                    "value": 8,
                                    "text": "Considerably severe"
                                },
                                {
                                    "value": 9,
                                    "text": "Extremely severe"
                                },
                                {
                                    "value": 10,
                                    "text": "Terrible"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID39",
                            "title": "Please select a punishment that you feel is suitable for this act.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "No punishment"
                                },
                                {
                                    "value": 2,
                                    "text": "10 hours community service"
                                },
                                {
                                    "value": 3,
                                    "text": "20 hours community service"
                                },
                                {
                                    "value": 4,
                                    "text": "40 hours community service"
                                },
                                {
                                    "value": 5,
                                    "text": "60 hours community service"
                                },
                                {
                                    "value": 6,
                                    "text": "One month jail time"
                                },
                                {
                                    "value": 7,
                                    "text": "Three months jail time"
                                },
                                {
                                    "value": 8,
                                    "text": "6 months jail time"
                                },
                                {
                                    "value": 9,
                                    "text": "1-5 years jail time "
                                },
                                {
                                    "value": 10,
                                    "text": "5 -10 years jail time"
                                },
                                {
                                    "value": 11,
                                    "text": "10+ years jail time"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "checkbox",
                            "name": "QID40",
                            "title": "Please select all items you saw in the image set.",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Lettuce"
                                },
                                {
                                    "value": 2,
                                    "text": "Apple"
                                },
                                {
                                    "value": 3,
                                    "text": "Water Bottle"
                                },
                                {
                                    "value": 4,
                                    "text": "Stone"
                                },
                                {
                                    "value": 5,
                                    "text": "Sweetcorn"
                                },
                                {
                                    "value": 6,
                                    "text": "Hairdryer"
                                }
                            ],
                            "isRequired": false,
                            "validators": []
                        },
                        {
                            "type": "html",
                            "name": "QID232",
                            "html": "<div>Please click the next button to continue.</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID42",
                            "html": "<div><div><br></div><div><br></div>Thank you for taking the time to participate in this study. This study is actually investigating the effects of disgust on the way we make moral decisions. Past research has connected the feeling of disgust with harsher judgement of moral violations. This study aims to investigate the link between feelings of disgust and the severity of the punishment that participants allocate to the moral violation. The pictures you saw created a short term disgust priming effect (made you feel disgusted) that may have influenced the punishment you chose for each type of moral violation.<div><br></div><div>Two types of moral violation were tested;&nbsp;</div><div>1) Situations that violated our internal values of purity and sanctity, protecting the general integrity of our being, we find these kinds of acts disgusting in themselves (without being primed)</div><div>2) Situations that were immoral e.g. breaking the law but did not pose a threat to our sense of moral integrity. These kinds of acts are recognised as immoral but we are not automatically disgusted by them.</div><div><br></div><div>Please make sure you submit this page using the 'submit to finish' button.</div></div>",
                            "isRequired": false
                        },
                        {
                            "type": "radiogroup",
                            "name": "QID43",
                            "title": "With this information in mind, do you still wish for your results to be used in this experiment? If not, close your browser now and your results will not be saved",
                            "choices": [
                                {
                                    "value": 1,
                                    "text": "Yes, I consent for my results to be used"
                                }
                            ],
                            "isRequired": true,
                            "validators": []
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID126",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0dpAmUoS3EJe5mt\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID78",
                            "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID93",
                            "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID152",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdvywqz0I1TrofH\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID178",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Ccsa8rH2hwgLat\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID203",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5BZL8cZB6JIaGhf\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID220",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_06YnkEa8QeaiEnz\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID216",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_77M2TSM63UvYRsV\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID115",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_aV7XXAesr4rmW69\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID116",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_ePRtvNZhHV4JKZL\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID118",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1RGJIddWaLviWA5\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID119",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_23ulilQe1yrKdBX\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID217",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_b7xcAl2yR5zTKV7\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID121",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bqhvIBHmJs7LC5v\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID122",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_7PMqtw25aV7a0Qd\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID123",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3VFoBCvyzhXF8uV\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID124",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_81vUDpE2fQqIyj3\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID153",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_daT4Usr05StpVhr\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID142",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_4T5MIcTxr6GPXBX\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID143",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cOMFom5VcJpmkzr\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID144",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3CKRnacZh47x2Nn\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID145",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5083djzo4Jip0Vv\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID146",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3aaW2Q5UHpVhnDL\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID147",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cBkclL7jqGAetDL\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID148",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0IjO9fOvXEmUYsd\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID149",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_86r2hkzT2ClrXZX\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID150",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_6YlVWZsNGr670fX\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID151",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9GeyNIgxpIsnPmZ\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [],
                    "maxTimeToFinish": 7
                },
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID167",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3OxijTxemcufwIl\"></div>",
                            "isRequired": false
                        }
                    ]
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID219",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9TWOVAAC43JvJ65\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID169",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5heJgRBnd8TAFVz\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID170",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_baoTFDe5fBdfwd7\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID171",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_etbcRN8Wks1AkwB\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID172",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bfmY33Zjl0TGfTT\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID173",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3kFuW7ZP8l51jOl\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID174",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_2c4hfdkIpkqQbA1\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID175",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bCojXxQzmz2zzXD\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID176",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eEzOW7WuXaO4WlD\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID177",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eUT9ECwCyIXvYRD\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID192",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdyIJvpU5ua0Yvj\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID193",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9H2Z5MvSZp82Bet\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID194",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eamyJGcBtm3drLf\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID195",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8B9TJbTI8gjReol\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID196",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1ACankibzBdbf9z\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID197",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0vcglYQRggVLLlX\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID198",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3Wa4Q28agDc0ezj\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID199",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_00Y3pLzoq8fHygB\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID201",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9XmIXuB7ShjM44d\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID202",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8iXqRhRNNuEF0H3\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        },
        {
            "pages": [
                {
                    "elements": [
                        {
                            "type": "html",
                            "name": "QID222",
                            "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Y17QYhFl7uhe97\"></div>",
                            "isRequired": false
                        }
                    ],
                    "maxTimeToFinish": 7
                }
            ]
        }
    ],
    "embeddedData": [
        [
            {
                "value": "0",
                "key": "order",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "0",
                "key": "order2",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "0",
                "key": "order3",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "0",
                "key": "order4",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order} + 1",
                "key": "order",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order}",
                "key": "mall",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order} + 1",
                "key": "order",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order}",
                "key": "graf",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order} + 1",
                "key": "order",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order}",
                "key": "bin",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order} + 1",
                "key": "order",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order}",
                "key": "letterbox",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order2} + 1",
                "key": "order2",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order2}",
                "key": "mall2",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order2} + 1",
                "key": "order2",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order2}",
                "key": "graf2",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order2} + 1",
                "key": "order2",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order2}",
                "key": "bin2",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order2} + 1",
                "key": "order2",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order2}",
                "key": "letterbox2",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order3} + 1",
                "key": "order3",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order3}",
                "key": "n1",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order3} + 1",
                "key": "order3",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order3}",
                "key": "p1",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order4} + 1",
                "key": "order4",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order4}",
                "key": "n2",
                "type": "Custom",
                "variableType": "String"
            }
        ],
        [
            {
                "value": "{order4} + 1",
                "key": "order4",
                "type": "Custom",
                "variableType": "String"
            },
            {
                "value": "{order4}",
                "key": "p2",
                "type": "Custom",
                "variableType": "String"
            }
        ]
    ],
    "surveysMap": {
        "BL_29vEOGtAicRipqR": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID1",
                                "html": "<div><div>&nbsp;</div>\n\n<div>\n<div><span style=\"display: none;\">&nbsp;</span><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em>Faculty of Health and Life Sciences</em></span></strong></em></span></strong></em></span></strong></em></div>\n</div>\n\n<p><em><em><strong><span lang=\"EN-US\">Department of Psychology, Health and Professional Development</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><strong><span lang=\"EN-US\">Headington Campus, Gipsy Lane, Oxford OX3 0BP.</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Sophie Thomas, Undergraduate, Email: 15067446@brookes.ac.uk</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Supervisor: Ben Kenward, Email: bkenward@brookes.ac.uk, Tel: 01865 482826, Address: Headington Campus, Gipsy Lane, Oxford OX3 0BP.&nbsp;</span></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n\n<p><em><em><strong><u><span style=\"font-size: 14pt; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">Responses to bad behaviour and</span><span style=\"font-size: 14pt; color: rgb(34, 34, 34);\"> <span style=\"background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">memory for unpleasant items: a research study</span></span><span style=\"font-size: 14pt;\"><o:p></o:p></span></u></strong></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">You are being invited to take part in a research study. Before you decide whether or not to take part, it is important for you to understand why the research is being done and what it will involve. Please take time to read the following information carefully</span><span style=\"font-size: 10pt; border: 1pt none windowtext; padding: 0cm;\"><o:p></o:p></span></em></em></em></p>\n\n<p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p><em><em><o:p>&nbsp;</o:p></em></em><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What is the purpose of the study?</em></em></strong></p>\n\n<p><br>\n<em><em>The purpose of this study is to investigate whether or not the content of images affects performance in memory tasks. The second aim of this study is to assess evaluations of bad behaviour.<o:p>&nbsp;</o:p></em></em><br>\n&nbsp;</p>\n<strong>Why am I being invited to take part?</strong><br>\n&nbsp;\n<div><em><em>Anyone over the age of 18 is invited to take part.</em></em><br>\n<br>\n<strong><em><em>Do I have to take part?</em></em> </strong><em><em><o:p><strong>&nbsp;</strong></o:p></em></em><br>\n<br>\n<br>\n<em style=\"font-family: arial, helvetica, sans-serif;\"><em><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">It is up to you to decide whether or not to take part. If you decide to take part you are still free to withdraw at any time before the data are analysed and without giving a reason. To do this simply close your browser at any point during the experiment and your results will not be saved.</span></em></em></em>\n\n<p><em><em><o:p></o:p></em></em></p>\n<em><em> </em></em>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What will happen to me if I take part?</em></em></strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">The experiment will take around 15 minutes. Due to the fact that the content of images is being investigated some of the images you will see will contain mildly disgusting content, e.g. rotten food, mild skin infections, vomit and bodily fluids such as urine and excrement. In addition to this, some of the moral situations you will be asked to read will contain mildly disturbing content e.g. crime, nudity and sexual situations. You will be asked to judge immoral behaviour by assigning punishment.</span></em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\"><o:p></o:p></span></p>\n\n<p><br>\n<em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">If you feel that any of this will affect you, DO NOT continue with the experiment. Simply close your browser to exit the experiment and your results will not be saved.&nbsp;</span></em><o:p></o:p></p>\n\n<p>&nbsp;</p>\n\n<p><strong>What are the possible benefits of taking part?</strong><br>\n<br>\n<br>\n<em><em>There are no direct benefits to you for taking part. You will however be contributing to an ongoing area of research and assisting me with my dissertation. At the end of the experiment there will be some further information about what is being investigated and you may find the experience interesting and informative.</em></em><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><br>\n<strong>Will what I say in this study be kept confidential?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The information you give and your answer to the experiment will be kept strictly confidential. The software used to distribute the survey does not collect IP addresses so there is no way of tracing your answers back to you. The only personal questions you will be asked will be your age and your gender, you will be assigned a participant ID and will remain anonymous throughout the whole experiment and during results and data analysis.</em></em><br>\n<br>\n<br>\n<strong>What should I do if I want to take part?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>If you would like to take part in the study, click the next button in the bottom right corner of this page.</em></em><br>\n<br>\n<br>\n<strong style=\"font-family: arial, helvetica, sans-serif;\">What will happen to the results of the research study?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The results of the study will be used in my dissertation project for the third year of my Psychology degree. If any interesting results are obtained they may be presented&nbsp;in a conference or published in a journal article. If you would like to know more about the results please email me and they will be available between April and September 2018.</em></em><br>\n<br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><strong>Who is organising and funding the research?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>I am conducting the research as a student at Oxford Brookes University in the Dept. of Psychology, Health and Professional Development, and the Faculty of Health &amp; Life Sciences.</em></em><br>\n<em><em><o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><strong>Who has reviewed the study?</strong></em><br>\n&nbsp;</p>\n\n<p><em><em>The research has been approved by the Psychology Research Ethics Committee, Oxford Brookes University. If you have any concerns about the way in which the study has been conducted, they should contact the Department Research Ethics Officer, Morag MacLean on mmmaclean@brookes.ac.uk<o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>Contact for Further Information</em></em></p>\n</div>\n\n<div>\n<p><br>\n<em><em>For any further information regarding the study please contact me (15067446@brookes.ac.uk) or my supervisor (bkenward@brookes.ac.uk).</em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\">Thank you for taking the time to read this information.<o:p></o:p></span></em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n<em><em><span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">Sophie Thomas<o:p></o:p></span> <span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">08/11/2017</span></em></em></div>\n\n<div>\n<div>\n<div>\n<div>&nbsp;</div>\n</div>\n</div>\n</div></div>",
                                "isRequired": false
                            }
                        ]
                    },
                    {
                        "elements": [
                            {
                                "type": "checkbox",
                                "name": "QID2",
                                "title": "<div><span style=\"font-size:16px;\">For the purposes of carrying out this Survey, the University uses the survey tools provided by Qualtrics with whom the University's Faculty of Health and Life Sciences holds an agreement. &nbsp;There is always a certain element of risk of data loss when data is collected and processed in an internet environment. &nbsp;This risk cannot be eliminated entirely and participants consenting to take part in the survey need to be aware of this risk. However, personal data will be minimised to the extent possible for the survey and the University believes that Qualtrics offers sufficient guarantees to keep the data secure while it is being processed. These security obligations are set out in the agreement between Qualtrics and the University. &nbsp;<br>\n<br>\nFurther information about Qualtrics can be found on the following web site:&nbsp;<a href=\"http://qualtrics.com/\">http://qualtrics.com/</a></span></div>",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "<span style=\"font-size:16px;\">I consent to participate in this survey</span>"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 0
        },
        "BL_2f41EVM3cPsfzvL": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "text",
                                "name": "QID3",
                                "inputType": "text",
                                "title": "How old are you in years?",
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID4",
                                "title": "What gender are you?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Woman"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Man"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Non-binary"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 1
        },
        "BL_887uZrlParj93NP": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID49",
                                "html": "<div>{order}<br>You are about to view a selection of images, pay close attention to what they show. Each image will be on screen for 7 seconds. After you have seen all of the images you will be asked to review two situations involving bad behaviour. Once this is completed there will be a memory recall task based on the images you are about to see.&nbsp;<div><br></div><div>Once you have completed the memory task the next set of pictures will begin. There are four sets in total.&nbsp;<br><div><br></div><div>Please click the next button to continue.&nbsp;</div></div></div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 2
        },
        "BL_6lKjMMhqZCT2dY9": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID7",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID8",
                                "html": "<div>A woman posts a bag of burning dog feces through the letterbox of her next door neighbour.&nbsp;</div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID9",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe"
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely Severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID10",
                                "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No Punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time"
                                    },
                                    {
                                        "value": 10,
                                        "text": "5-10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 3
        },
        "BL_9Hu5xn26fHWBLtb": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID223",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID11",
                                "html": "<div>A man runs around a busy shopping centre with a knife, chasing people and asking them for money.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID12",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very Slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe"
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID13",
                                "title": "Please select a punishment that you think is suitable for this act.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 4
        },
        "BL_0k7hEIHITIefizX": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "checkbox",
                                "name": "QID14",
                                "title": "Please select all the items you saw in the set of images.&nbsp;",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Apples"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Football"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Cotton Bud"
                                    },
                                    {
                                        "value": 4,
                                        "text": "T-shirt"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Pumpkin"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Razor"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "html",
                                "name": "QID229",
                                "html": "<div>Please click the next button to continue.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 5
        },
        "BL_cJhtsgyVwNZlu6N": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID15",
                                "html": "<div>Please click the next button in order to start the next set of images.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 6
        },
        "BL_cBnLiYSiTrlxXkV": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID224",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID16",
                                "html": "<div>A man is caught painting graffiti onto an alley wall depicting a gang slogan.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID17",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID18",
                                "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 7
        },
        "BL_e9jHneBc9aSZdoF": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "checkbox",
                                "name": "QID21",
                                "title": "Please select all items you saw in the images.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Strawberry"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Elephant"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Hot Dog"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Spaghetti"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Peanut"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Banana"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "html",
                                "name": "QID230",
                                "html": "<div>Please click the next button to continue.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 8
        },
        "BL_d4PWm9jyPZdTXXT": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID22",
                                "html": "<div>Please click the next button in order to start the next set of images.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 9
        },
        "BL_4NqFV8D92O9HRR3": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID228",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID23",
                                "html": "<div>A man searches through a bin to find women's' used underwear to sell online.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID24",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID25",
                                "title": "Please select a punishment that you think is suitable for this act.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 10
        },
        "BL_d4oyjmyTWoh1v8N": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID227",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID26",
                                "html": "<div>A naked man runs around a busy shopping centre whilst pointing to his genitals.&nbsp;</div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID27",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 2,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 8,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 9,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 11,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID28",
                                "title": "Please select a punishment that you think this suitable for this act.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 11
        },
        "BL_6rsSfcNP96HET5z": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID225",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID29",
                                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man searches through\nsome recycled-paper bins to try and find other people’s personal details in\norder to commit identity fraud.<o:p></o:p></span></p></div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID30",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 2,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 8,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 9,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 11,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID31",
                                "title": "Please select a punishment that you think is suitable for this act.",
                                "choices": [
                                    {
                                        "value": "11",
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 1,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 2,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 9,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 10,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 12
        },
        "BL_4OOpvreKpfLgWJ7": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID32",
                                "html": "<div>Please click the next button to move onto the final set of pictures.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 13
        },
        "BL_3eHk92olyGFFkyh": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "checkbox",
                                "name": "QID33",
                                "title": "Please select items that you saw in the image set.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Sink"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Hot Air Balloon"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Cucumber"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Bin"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Fox"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Pool"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "html",
                                "name": "QID231",
                                "html": "<div>Please click the next button to continue.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 14
        },
        "BL_6x8gCLjtX9nGzVb": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID110",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID34",
                                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A woman posts a burning\nnewspaper through the letterbox of her next door neighbour and it damages the\nhallway.</span><o:p></o:p></p></div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID35",
                                "title": "How severe do you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID36",
                                "title": "Please select a punishment that you feel is suitable for this act.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 15
        },
        "BL_eD7qRPqkAaAj1Gd": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID226",
                                "html": "<div>Please read the following situation.</div>",
                                "isRequired": false
                            },
                            {
                                "type": "html",
                                "name": "QID37",
                                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man is caught painting\ngraffiti onto an alley wall depicting a man having sex with a dog.</span><o:p></o:p></p></div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID38",
                                "title": "Please select how severe you feel this act was?",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Not bad"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Very slightly bad"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Slightly bad"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Moderately bad"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Considerably bad"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Very bad"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Severe "
                                    },
                                    {
                                        "value": 8,
                                        "text": "Considerably severe"
                                    },
                                    {
                                        "value": 9,
                                        "text": "Extremely severe"
                                    },
                                    {
                                        "value": 10,
                                        "text": "Terrible"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID39",
                                "title": "Please select a punishment that you feel is suitable for this act.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "No punishment"
                                    },
                                    {
                                        "value": 2,
                                        "text": "10 hours community service"
                                    },
                                    {
                                        "value": 3,
                                        "text": "20 hours community service"
                                    },
                                    {
                                        "value": 4,
                                        "text": "40 hours community service"
                                    },
                                    {
                                        "value": 5,
                                        "text": "60 hours community service"
                                    },
                                    {
                                        "value": 6,
                                        "text": "One month jail time"
                                    },
                                    {
                                        "value": 7,
                                        "text": "Three months jail time"
                                    },
                                    {
                                        "value": 8,
                                        "text": "6 months jail time"
                                    },
                                    {
                                        "value": 9,
                                        "text": "1-5 years jail time "
                                    },
                                    {
                                        "value": 10,
                                        "text": "5 -10 years jail time"
                                    },
                                    {
                                        "value": 11,
                                        "text": "10+ years jail time"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 16
        },
        "BL_25L6d4ulLSz39J3": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "checkbox",
                                "name": "QID40",
                                "title": "Please select all items you saw in the image set.",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Lettuce"
                                    },
                                    {
                                        "value": 2,
                                        "text": "Apple"
                                    },
                                    {
                                        "value": 3,
                                        "text": "Water Bottle"
                                    },
                                    {
                                        "value": 4,
                                        "text": "Stone"
                                    },
                                    {
                                        "value": 5,
                                        "text": "Sweetcorn"
                                    },
                                    {
                                        "value": 6,
                                        "text": "Hairdryer"
                                    }
                                ],
                                "isRequired": false,
                                "validators": []
                            },
                            {
                                "type": "html",
                                "name": "QID232",
                                "html": "<div>Please click the next button to continue.</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 17
        },
        "BL_1AmylnCwWPzwF2R": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID42",
                                "html": "<div><div><br></div><div><br></div>Thank you for taking the time to participate in this study. This study is actually investigating the effects of disgust on the way we make moral decisions. Past research has connected the feeling of disgust with harsher judgement of moral violations. This study aims to investigate the link between feelings of disgust and the severity of the punishment that participants allocate to the moral violation. The pictures you saw created a short term disgust priming effect (made you feel disgusted) that may have influenced the punishment you chose for each type of moral violation.<div><br></div><div>Two types of moral violation were tested;&nbsp;</div><div>1) Situations that violated our internal values of purity and sanctity, protecting the general integrity of our being, we find these kinds of acts disgusting in themselves (without being primed)</div><div>2) Situations that were immoral e.g. breaking the law but did not pose a threat to our sense of moral integrity. These kinds of acts are recognised as immoral but we are not automatically disgusted by them.</div><div><br></div><div>Please make sure you submit this page using the 'submit to finish' button.</div></div>",
                                "isRequired": false
                            },
                            {
                                "type": "radiogroup",
                                "name": "QID43",
                                "title": "With this information in mind, do you still wish for your results to be used in this experiment? If not, close your browser now and your results will not be saved",
                                "choices": [
                                    {
                                        "value": 1,
                                        "text": "Yes, I consent for my results to be used"
                                    }
                                ],
                                "isRequired": true,
                                "validators": []
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 18
        },
        "BL_9BmiM8slDc2zToN": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID126",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0dpAmUoS3EJe5mt\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 19
        },
        "BL_5b6iXeYfQNaRBA1": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID78",
                                "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 20
        },
        "BL_ac3kZ2fg74Y1sWN": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID93",
                                "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 21
        },
        "BL_8wfq2HRKy78wmxL": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID152",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdvywqz0I1TrofH\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 22
        },
        "BL_cABchsX3bSpstNz": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID178",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Ccsa8rH2hwgLat\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 23
        },
        "BL_afWV8E0H1HBkSMt": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID203",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5BZL8cZB6JIaGhf\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 24
        },
        "BL_3n6Z3N2ZJugsdCt": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID220",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_06YnkEa8QeaiEnz\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 25
        },
        "BL_bpYnvnrP02EOj8V": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID216",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_77M2TSM63UvYRsV\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 26
        },
        "BL_1GkQrNOd95N5TrT": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID115",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_aV7XXAesr4rmW69\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 27
        },
        "BL_6got6YJxEpeByBf": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID116",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_ePRtvNZhHV4JKZL\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 28
        },
        "BL_6zcEuESDl6U3kot": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID118",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1RGJIddWaLviWA5\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 29
        },
        "BL_0pU6CIKP7LPdq4t": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID119",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_23ulilQe1yrKdBX\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 30
        },
        "BL_bgBJNxLJIHcf6FT": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID217",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_b7xcAl2yR5zTKV7\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 31
        },
        "BL_9HmQI3oyfEdVTFj": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID121",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bqhvIBHmJs7LC5v\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 32
        },
        "BL_7WmsTdNYo0P025T": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID122",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_7PMqtw25aV7a0Qd\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 33
        },
        "BL_bpVxkhBY6CA1JJj": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID123",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3VFoBCvyzhXF8uV\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 34
        },
        "BL_etyIR5Camld2MhD": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID124",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_81vUDpE2fQqIyj3\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 35
        },
        "BL_eyDg5C7FdPU3ef3": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID153",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_daT4Usr05StpVhr\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 36
        },
        "BL_cTirwCKIJaDxL6d": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID142",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_4T5MIcTxr6GPXBX\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 37
        },
        "BL_0xGPnnwpiRcnPuJ": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID143",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cOMFom5VcJpmkzr\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 38
        },
        "BL_bxuu3LdIFbZOPUF": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID144",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3CKRnacZh47x2Nn\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 39
        },
        "BL_6zMj8qzKDRP1EvX": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID145",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5083djzo4Jip0Vv\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 40
        },
        "BL_4IqaxevmEmRYk2F": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID146",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3aaW2Q5UHpVhnDL\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 41
        },
        "BL_a3i0DnYeTC1Z2qF": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID147",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cBkclL7jqGAetDL\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 42
        },
        "BL_0HhiDryZUtk4khT": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID148",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0IjO9fOvXEmUYsd\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 43
        },
        "BL_8uBesvv3S2KZwyN": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID149",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_86r2hkzT2ClrXZX\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 44
        },
        "BL_7R0xlbDiLsQv4W1": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID150",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_6YlVWZsNGr670fX\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 45
        },
        "BL_3yOIT7OLMYTCKDX": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID151",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9GeyNIgxpIsnPmZ\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 46
        },
        "BL_5hwD80CdJIxx9lz": {
            "survey": {
                "pages": [
                    {
                        "elements": [],
                        "maxTimeToFinish": 7
                    },
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID167",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3OxijTxemcufwIl\"></div>",
                                "isRequired": false
                            }
                        ]
                    }
                ]
            },
            "surveyIdx": 47
        },
        "BL_8B2fC7tCFegDAwd": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID219",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9TWOVAAC43JvJ65\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 48
        },
        "BL_cPk3EITViEekcKh": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID169",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5heJgRBnd8TAFVz\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 49
        },
        "BL_9nbn26yLntRcyeF": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID170",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_baoTFDe5fBdfwd7\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 50
        },
        "BL_3sEiWPHHfLtDCNT": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID171",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_etbcRN8Wks1AkwB\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 51
        },
        "BL_3QmuQKgwHkdcxTv": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID172",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bfmY33Zjl0TGfTT\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 52
        },
        "BL_2hqdk9j2dueix1j": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID173",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3kFuW7ZP8l51jOl\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 53
        },
        "BL_4ISaFmxIrW6bLyB": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID174",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_2c4hfdkIpkqQbA1\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 54
        },
        "BL_5gSWzY2of9GipmZ": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID175",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bCojXxQzmz2zzXD\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 55
        },
        "BL_eexPq6jqL4nBqbb": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID176",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eEzOW7WuXaO4WlD\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 56
        },
        "BL_9QOlqKATGO2yF0N": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID177",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eUT9ECwCyIXvYRD\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 57
        },
        "BL_2f9fm298RaA9UIB": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID192",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdyIJvpU5ua0Yvj\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 58
        },
        "BL_bCz4OQ4oWVwmEq9": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID193",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9H2Z5MvSZp82Bet\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 59
        },
        "BL_0diiYV9pF0ir5iJ": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID194",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eamyJGcBtm3drLf\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 60
        },
        "BL_9LbiOlOGi2fzNUV": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID195",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8B9TJbTI8gjReol\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 61
        },
        "BL_bd7jZzUbDnmJyjH": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID196",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1ACankibzBdbf9z\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 62
        },
        "BL_cGca5lDIzg60K3j": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID197",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0vcglYQRggVLLlX\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 63
        },
        "BL_eKbQkFujjqOE137": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID198",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3Wa4Q28agDc0ezj\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 64
        },
        "BL_3wpc4vxu2BN6ff7": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID199",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_00Y3pLzoq8fHygB\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 65
        },
        "BL_bq174KfKQhvHckB": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID201",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9XmIXuB7ShjM44d\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 66
        },
        "BL_6Sgckq6ZsmwqlKZ": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID202",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8iXqRhRNNuEF0H3\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 67
        },
        "BL_8Cb5hPsQMgbRYzP": {
            "survey": {
                "pages": [
                    {
                        "elements": [
                            {
                                "type": "html",
                                "name": "QID222",
                                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Y17QYhFl7uhe97\"></div>",
                                "isRequired": false
                            }
                        ],
                        "maxTimeToFinish": 7
                    }
                ]
            },
            "surveyIdx": 68
        }
    },
    "questionMapsBySurvey": [
        {
            "QID1": {
                "type": "html",
                "name": "QID1",
                "html": "<div><div>&nbsp;</div>\n\n<div>\n<div><span style=\"display: none;\">&nbsp;</span><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em><strong><span lang=\"EN-US\"><em>Faculty of Health and Life Sciences</em></span></strong></em></span></strong></em></span></strong></em></div>\n</div>\n\n<p><em><em><strong><span lang=\"EN-US\">Department of Psychology, Health and Professional Development</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><strong><span lang=\"EN-US\">Headington Campus, Gipsy Lane, Oxford OX3 0BP.</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></strong></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Sophie Thomas, Undergraduate, Email: 15067446@brookes.ac.uk</span><span lang=\"EN-US\" style=\"font-size:10.0pt;mso-ansi-language:EN-US\"><o:p></o:p></span></em></em></p>\n\n<p><em><em><span lang=\"EN-US\">Supervisor: Ben Kenward, Email: bkenward@brookes.ac.uk, Tel: 01865 482826, Address: Headington Campus, Gipsy Lane, Oxford OX3 0BP.&nbsp;</span></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n\n<p><em><em><strong><u><span style=\"font-size: 14pt; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">Responses to bad behaviour and</span><span style=\"font-size: 14pt; color: rgb(34, 34, 34);\"> <span style=\"background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">memory for unpleasant items: a research study</span></span><span style=\"font-size: 14pt;\"><o:p></o:p></span></u></strong></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">You are being invited to take part in a research study. Before you decide whether or not to take part, it is important for you to understand why the research is being done and what it will involve. Please take time to read the following information carefully</span><span style=\"font-size: 10pt; border: 1pt none windowtext; padding: 0cm;\"><o:p></o:p></span></em></em></em></p>\n\n<p>&nbsp;</p>\n\n<p>&nbsp;</p>\n\n<p><em><em><o:p>&nbsp;</o:p></em></em><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What is the purpose of the study?</em></em></strong></p>\n\n<p><br>\n<em><em>The purpose of this study is to investigate whether or not the content of images affects performance in memory tasks. The second aim of this study is to assess evaluations of bad behaviour.<o:p>&nbsp;</o:p></em></em><br>\n&nbsp;</p>\n<strong>Why am I being invited to take part?</strong><br>\n&nbsp;\n<div><em><em>Anyone over the age of 18 is invited to take part.</em></em><br>\n<br>\n<strong><em><em>Do I have to take part?</em></em> </strong><em><em><o:p><strong>&nbsp;</strong></o:p></em></em><br>\n<br>\n<br>\n<em style=\"font-family: arial, helvetica, sans-serif;\"><em><em><span style=\"border: 1pt none windowtext; padding: 0cm;\">It is up to you to decide whether or not to take part. If you decide to take part you are still free to withdraw at any time before the data are analysed and without giving a reason. To do this simply close your browser at any point during the experiment and your results will not be saved.</span></em></em></em>\n\n<p><em><em><o:p></o:p></em></em></p>\n<em><em> </em></em>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><strong style=\"font-family: arial, helvetica, sans-serif;\"><em><em>What will happen to me if I take part?</em></em></strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">The experiment will take around 15 minutes. Due to the fact that the content of images is being investigated some of the images you will see will contain mildly disgusting content, e.g. rotten food, mild skin infections, vomit and bodily fluids such as urine and excrement. In addition to this, some of the moral situations you will be asked to read will contain mildly disturbing content e.g. crime, nudity and sexual situations. You will be asked to judge immoral behaviour by assigning punishment.</span></em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\"><o:p></o:p></span></p>\n\n<p><br>\n<em><span style=\"line-height: 107%; color: rgb(34, 34, 34); background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">If you feel that any of this will affect you, DO NOT continue with the experiment. Simply close your browser to exit the experiment and your results will not be saved.&nbsp;</span></em><o:p></o:p></p>\n\n<p>&nbsp;</p>\n\n<p><strong>What are the possible benefits of taking part?</strong><br>\n<br>\n<br>\n<em><em>There are no direct benefits to you for taking part. You will however be contributing to an ongoing area of research and assisting me with my dissertation. At the end of the experiment there will be some further information about what is being investigated and you may find the experience interesting and informative.</em></em><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><br>\n<strong>Will what I say in this study be kept confidential?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The information you give and your answer to the experiment will be kept strictly confidential. The software used to distribute the survey does not collect IP addresses so there is no way of tracing your answers back to you. The only personal questions you will be asked will be your age and your gender, you will be assigned a participant ID and will remain anonymous throughout the whole experiment and during results and data analysis.</em></em><br>\n<br>\n<br>\n<strong>What should I do if I want to take part?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>If you would like to take part in the study, click the next button in the bottom right corner of this page.</em></em><br>\n<br>\n<br>\n<strong style=\"font-family: arial, helvetica, sans-serif;\">What will happen to the results of the research study?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>The results of the study will be used in my dissertation project for the third year of my Psychology degree. If any interesting results are obtained they may be presented&nbsp;in a conference or published in a journal article. If you would like to know more about the results please email me and they will be available between April and September 2018.</em></em><br>\n<br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><strong>Who is organising and funding the research?</strong><br>\n&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>I am conducting the research as a student at Oxford Brookes University in the Dept. of Psychology, Health and Professional Development, and the Faculty of Health &amp; Life Sciences.</em></em><br>\n<em><em><o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n\n<p><em><strong>Who has reviewed the study?</strong></em><br>\n&nbsp;</p>\n\n<p><em><em>The research has been approved by the Psychology Research Ethics Committee, Oxford Brookes University. If you have any concerns about the way in which the study has been conducted, they should contact the Department Research Ethics Officer, Morag MacLean on mmmaclean@brookes.ac.uk<o:p></o:p></em></em></p>\n\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em>Contact for Further Information</em></em></p>\n</div>\n\n<div>\n<p><br>\n<em><em>For any further information regarding the study please contact me (15067446@brookes.ac.uk) or my supervisor (bkenward@brookes.ac.uk).</em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\">Thank you for taking the time to read this information.<o:p></o:p></span></em></em></p>\n</div>\n\n<div>\n<p>&nbsp;</p>\n</div>\n\n<div>\n<p><em><em><span style=\"font-size: 10pt;\"><o:p>&nbsp;</o:p></span></em></em></p>\n<em><em><span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">Sophie Thomas<o:p></o:p></span> <span style=\"font-size:10.0pt;\nmso-bidi-font-family:Arial\">08/11/2017</span></em></em></div>\n\n<div>\n<div>\n<div>\n<div>&nbsp;</div>\n</div>\n</div>\n</div></div>",
                "isRequired": false
            },
            "QID2": {
                "type": "checkbox",
                "name": "QID2",
                "title": "<div><span style=\"font-size:16px;\">For the purposes of carrying out this Survey, the University uses the survey tools provided by Qualtrics with whom the University's Faculty of Health and Life Sciences holds an agreement. &nbsp;There is always a certain element of risk of data loss when data is collected and processed in an internet environment. &nbsp;This risk cannot be eliminated entirely and participants consenting to take part in the survey need to be aware of this risk. However, personal data will be minimised to the extent possible for the survey and the University believes that Qualtrics offers sufficient guarantees to keep the data secure while it is being processed. These security obligations are set out in the agreement between Qualtrics and the University. &nbsp;<br>\n<br>\nFurther information about Qualtrics can be found on the following web site:&nbsp;<a href=\"http://qualtrics.com/\">http://qualtrics.com/</a></span></div>",
                "choices": [
                    {
                        "value": 1,
                        "text": "<span style=\"font-size:16px;\">I consent to participate in this survey</span>"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID3": {
                "type": "text",
                "name": "QID3",
                "inputType": "text",
                "title": "How old are you in years?",
                "isRequired": false,
                "validators": []
            },
            "QID4": {
                "type": "radiogroup",
                "name": "QID4",
                "title": "What gender are you?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Woman"
                    },
                    {
                        "value": 2,
                        "text": "Man"
                    },
                    {
                        "value": 3,
                        "text": "Non-binary"
                    }
                ],
                "isRequired": false,
                "validators": []
            }
        },
        {
            "QID49": {
                "type": "html",
                "name": "QID49",
                "html": "<div>{order}<br>You are about to view a selection of images, pay close attention to what they show. Each image will be on screen for 7 seconds. After you have seen all of the images you will be asked to review two situations involving bad behaviour. Once this is completed there will be a memory recall task based on the images you are about to see.&nbsp;<div><br></div><div>Once you have completed the memory task the next set of pictures will begin. There are four sets in total.&nbsp;<br><div><br></div><div>Please click the next button to continue.&nbsp;</div></div></div>",
                "isRequired": false
            }
        },
        {
            "QID7": {
                "type": "html",
                "name": "QID7",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID8": {
                "type": "html",
                "name": "QID8",
                "html": "<div>A woman posts a bag of burning dog feces through the letterbox of her next door neighbour.&nbsp;</div>",
                "isRequired": false
            },
            "QID9": {
                "type": "radiogroup",
                "name": "QID9",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe"
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely Severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID10": {
                "type": "radiogroup",
                "name": "QID10",
                "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                "choices": [
                    {
                        "value": 1,
                        "text": "No Punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time"
                    },
                    {
                        "value": 10,
                        "text": "5-10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": false,
                "validators": []
            }
        },
        {
            "QID223": {
                "type": "html",
                "name": "QID223",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID11": {
                "type": "html",
                "name": "QID11",
                "html": "<div>A man runs around a busy shopping centre with a knife, chasing people and asking them for money.</div>",
                "isRequired": false
            },
            "QID12": {
                "type": "radiogroup",
                "name": "QID12",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very Slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe"
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID13": {
                "type": "radiogroup",
                "name": "QID13",
                "title": "Please select a punishment that you think is suitable for this act.",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID14": {
                "type": "checkbox",
                "name": "QID14",
                "title": "Please select all the items you saw in the set of images.&nbsp;",
                "choices": [
                    {
                        "value": 1,
                        "text": "Apples"
                    },
                    {
                        "value": 2,
                        "text": "Football"
                    },
                    {
                        "value": 3,
                        "text": "Cotton Bud"
                    },
                    {
                        "value": 4,
                        "text": "T-shirt"
                    },
                    {
                        "value": 5,
                        "text": "Pumpkin"
                    },
                    {
                        "value": 6,
                        "text": "Razor"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID229": {
                "type": "html",
                "name": "QID229",
                "html": "<div>Please click the next button to continue.</div>",
                "isRequired": false
            }
        },
        {
            "QID15": {
                "type": "html",
                "name": "QID15",
                "html": "<div>Please click the next button in order to start the next set of images.</div>",
                "isRequired": false
            }
        },
        {
            "QID224": {
                "type": "html",
                "name": "QID224",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID16": {
                "type": "html",
                "name": "QID16",
                "html": "<div>A man is caught painting graffiti onto an alley wall depicting a gang slogan.</div>",
                "isRequired": false
            },
            "QID17": {
                "type": "radiogroup",
                "name": "QID17",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe "
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID18": {
                "type": "radiogroup",
                "name": "QID18",
                "title": "Please select a punishment that you think is suitable for this act.&nbsp;",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID21": {
                "type": "checkbox",
                "name": "QID21",
                "title": "Please select all items you saw in the images.",
                "choices": [
                    {
                        "value": 1,
                        "text": "Strawberry"
                    },
                    {
                        "value": 2,
                        "text": "Elephant"
                    },
                    {
                        "value": 3,
                        "text": "Hot Dog"
                    },
                    {
                        "value": 4,
                        "text": "Spaghetti"
                    },
                    {
                        "value": 5,
                        "text": "Peanut"
                    },
                    {
                        "value": 6,
                        "text": "Banana"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID230": {
                "type": "html",
                "name": "QID230",
                "html": "<div>Please click the next button to continue.</div>",
                "isRequired": false
            }
        },
        {
            "QID22": {
                "type": "html",
                "name": "QID22",
                "html": "<div>Please click the next button in order to start the next set of images.</div>",
                "isRequired": false
            }
        },
        {
            "QID228": {
                "type": "html",
                "name": "QID228",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID23": {
                "type": "html",
                "name": "QID23",
                "html": "<div>A man searches through a bin to find women's' used underwear to sell online.</div>",
                "isRequired": false
            },
            "QID24": {
                "type": "radiogroup",
                "name": "QID24",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe "
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID25": {
                "type": "radiogroup",
                "name": "QID25",
                "title": "Please select a punishment that you think is suitable for this act.",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID227": {
                "type": "html",
                "name": "QID227",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID26": {
                "type": "html",
                "name": "QID26",
                "html": "<div>A naked man runs around a busy shopping centre whilst pointing to his genitals.&nbsp;</div>",
                "isRequired": false
            },
            "QID27": {
                "type": "radiogroup",
                "name": "QID27",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 2,
                        "text": "Not bad"
                    },
                    {
                        "value": 3,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 5,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 6,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 7,
                        "text": "Very bad"
                    },
                    {
                        "value": 8,
                        "text": "Severe "
                    },
                    {
                        "value": 9,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 10,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 11,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID28": {
                "type": "radiogroup",
                "name": "QID28",
                "title": "Please select a punishment that you think this suitable for this act.",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID225": {
                "type": "html",
                "name": "QID225",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID29": {
                "type": "html",
                "name": "QID29",
                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man searches through\nsome recycled-paper bins to try and find other people’s personal details in\norder to commit identity fraud.<o:p></o:p></span></p></div>",
                "isRequired": false
            },
            "QID30": {
                "type": "radiogroup",
                "name": "QID30",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 2,
                        "text": "Not bad"
                    },
                    {
                        "value": 3,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 5,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 6,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 7,
                        "text": "Very bad"
                    },
                    {
                        "value": 8,
                        "text": "Severe "
                    },
                    {
                        "value": 9,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 10,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 11,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID31": {
                "type": "radiogroup",
                "name": "QID31",
                "title": "Please select a punishment that you think is suitable for this act.",
                "choices": [
                    {
                        "value": "11",
                        "text": "No punishment"
                    },
                    {
                        "value": 1,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 2,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "One month jail time"
                    },
                    {
                        "value": 6,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 7,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 8,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 9,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 10,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID32": {
                "type": "html",
                "name": "QID32",
                "html": "<div>Please click the next button to move onto the final set of pictures.</div>",
                "isRequired": false
            }
        },
        {
            "QID33": {
                "type": "checkbox",
                "name": "QID33",
                "title": "Please select items that you saw in the image set.",
                "choices": [
                    {
                        "value": 1,
                        "text": "Sink"
                    },
                    {
                        "value": 2,
                        "text": "Hot Air Balloon"
                    },
                    {
                        "value": 3,
                        "text": "Cucumber"
                    },
                    {
                        "value": 4,
                        "text": "Bin"
                    },
                    {
                        "value": 5,
                        "text": "Fox"
                    },
                    {
                        "value": 6,
                        "text": "Pool"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID231": {
                "type": "html",
                "name": "QID231",
                "html": "<div>Please click the next button to continue.</div>",
                "isRequired": false
            }
        },
        {
            "QID110": {
                "type": "html",
                "name": "QID110",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID34": {
                "type": "html",
                "name": "QID34",
                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A woman posts a burning\nnewspaper through the letterbox of her next door neighbour and it damages the\nhallway.</span><o:p></o:p></p></div>",
                "isRequired": false
            },
            "QID35": {
                "type": "radiogroup",
                "name": "QID35",
                "title": "How severe do you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe "
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID36": {
                "type": "radiogroup",
                "name": "QID36",
                "title": "Please select a punishment that you feel is suitable for this act.",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID226": {
                "type": "html",
                "name": "QID226",
                "html": "<div>Please read the following situation.</div>",
                "isRequired": false
            },
            "QID37": {
                "type": "html",
                "name": "QID37",
                "html": "<div><p><span style=\"font-size: 11.5pt; line-height: 107%; font-family: Helvetica, sans-serif; background-image: initial; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial;\">A man is caught painting\ngraffiti onto an alley wall depicting a man having sex with a dog.</span><o:p></o:p></p></div>",
                "isRequired": false
            },
            "QID38": {
                "type": "radiogroup",
                "name": "QID38",
                "title": "Please select how severe you feel this act was?",
                "choices": [
                    {
                        "value": 1,
                        "text": "Not bad"
                    },
                    {
                        "value": 2,
                        "text": "Very slightly bad"
                    },
                    {
                        "value": 3,
                        "text": "Slightly bad"
                    },
                    {
                        "value": 4,
                        "text": "Moderately bad"
                    },
                    {
                        "value": 5,
                        "text": "Considerably bad"
                    },
                    {
                        "value": 6,
                        "text": "Very bad"
                    },
                    {
                        "value": 7,
                        "text": "Severe "
                    },
                    {
                        "value": 8,
                        "text": "Considerably severe"
                    },
                    {
                        "value": 9,
                        "text": "Extremely severe"
                    },
                    {
                        "value": 10,
                        "text": "Terrible"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID39": {
                "type": "radiogroup",
                "name": "QID39",
                "title": "Please select a punishment that you feel is suitable for this act.",
                "choices": [
                    {
                        "value": 1,
                        "text": "No punishment"
                    },
                    {
                        "value": 2,
                        "text": "10 hours community service"
                    },
                    {
                        "value": 3,
                        "text": "20 hours community service"
                    },
                    {
                        "value": 4,
                        "text": "40 hours community service"
                    },
                    {
                        "value": 5,
                        "text": "60 hours community service"
                    },
                    {
                        "value": 6,
                        "text": "One month jail time"
                    },
                    {
                        "value": 7,
                        "text": "Three months jail time"
                    },
                    {
                        "value": 8,
                        "text": "6 months jail time"
                    },
                    {
                        "value": 9,
                        "text": "1-5 years jail time "
                    },
                    {
                        "value": 10,
                        "text": "5 -10 years jail time"
                    },
                    {
                        "value": 11,
                        "text": "10+ years jail time"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID40": {
                "type": "checkbox",
                "name": "QID40",
                "title": "Please select all items you saw in the image set.",
                "choices": [
                    {
                        "value": 1,
                        "text": "Lettuce"
                    },
                    {
                        "value": 2,
                        "text": "Apple"
                    },
                    {
                        "value": 3,
                        "text": "Water Bottle"
                    },
                    {
                        "value": 4,
                        "text": "Stone"
                    },
                    {
                        "value": 5,
                        "text": "Sweetcorn"
                    },
                    {
                        "value": 6,
                        "text": "Hairdryer"
                    }
                ],
                "isRequired": false,
                "validators": []
            },
            "QID232": {
                "type": "html",
                "name": "QID232",
                "html": "<div>Please click the next button to continue.</div>",
                "isRequired": false
            }
        },
        {
            "QID42": {
                "type": "html",
                "name": "QID42",
                "html": "<div><div><br></div><div><br></div>Thank you for taking the time to participate in this study. This study is actually investigating the effects of disgust on the way we make moral decisions. Past research has connected the feeling of disgust with harsher judgement of moral violations. This study aims to investigate the link between feelings of disgust and the severity of the punishment that participants allocate to the moral violation. The pictures you saw created a short term disgust priming effect (made you feel disgusted) that may have influenced the punishment you chose for each type of moral violation.<div><br></div><div>Two types of moral violation were tested;&nbsp;</div><div>1) Situations that violated our internal values of purity and sanctity, protecting the general integrity of our being, we find these kinds of acts disgusting in themselves (without being primed)</div><div>2) Situations that were immoral e.g. breaking the law but did not pose a threat to our sense of moral integrity. These kinds of acts are recognised as immoral but we are not automatically disgusted by them.</div><div><br></div><div>Please make sure you submit this page using the 'submit to finish' button.</div></div>",
                "isRequired": false
            },
            "QID43": {
                "type": "radiogroup",
                "name": "QID43",
                "title": "With this information in mind, do you still wish for your results to be used in this experiment? If not, close your browser now and your results will not be saved",
                "choices": [
                    {
                        "value": 1,
                        "text": "Yes, I consent for my results to be used"
                    }
                ],
                "isRequired": true,
                "validators": []
            }
        },
        {
            "QID126": {
                "type": "html",
                "name": "QID126",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0dpAmUoS3EJe5mt\"></div>",
                "isRequired": false
            }
        },
        {
            "QID78": {
                "type": "html",
                "name": "QID78",
                "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                "isRequired": false
            }
        },
        {
            "QID93": {
                "type": "html",
                "name": "QID93",
                "html": "<div>Please read the following moral situation and indicate how severe you think this act was and select an appropriate punishment.&nbsp;</div>",
                "isRequired": false
            }
        },
        {
            "QID152": {
                "type": "html",
                "name": "QID152",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdvywqz0I1TrofH\"></div>",
                "isRequired": false
            }
        },
        {
            "QID178": {
                "type": "html",
                "name": "QID178",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Ccsa8rH2hwgLat\"></div>",
                "isRequired": false
            }
        },
        {
            "QID203": {
                "type": "html",
                "name": "QID203",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5BZL8cZB6JIaGhf\"></div>",
                "isRequired": false
            }
        },
        {
            "QID220": {
                "type": "html",
                "name": "QID220",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_06YnkEa8QeaiEnz\"></div>",
                "isRequired": false
            }
        },
        {
            "QID216": {
                "type": "html",
                "name": "QID216",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_77M2TSM63UvYRsV\"></div>",
                "isRequired": false
            }
        },
        {
            "QID115": {
                "type": "html",
                "name": "QID115",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_aV7XXAesr4rmW69\"></div>",
                "isRequired": false
            }
        },
        {
            "QID116": {
                "type": "html",
                "name": "QID116",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_ePRtvNZhHV4JKZL\"></div>",
                "isRequired": false
            }
        },
        {
            "QID118": {
                "type": "html",
                "name": "QID118",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1RGJIddWaLviWA5\"></div>",
                "isRequired": false
            }
        },
        {
            "QID119": {
                "type": "html",
                "name": "QID119",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_23ulilQe1yrKdBX\"></div>",
                "isRequired": false
            }
        },
        {
            "QID217": {
                "type": "html",
                "name": "QID217",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_b7xcAl2yR5zTKV7\"></div>",
                "isRequired": false
            }
        },
        {
            "QID121": {
                "type": "html",
                "name": "QID121",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bqhvIBHmJs7LC5v\"></div>",
                "isRequired": false
            }
        },
        {
            "QID122": {
                "type": "html",
                "name": "QID122",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_7PMqtw25aV7a0Qd\"></div>",
                "isRequired": false
            }
        },
        {
            "QID123": {
                "type": "html",
                "name": "QID123",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3VFoBCvyzhXF8uV\"></div>",
                "isRequired": false
            }
        },
        {
            "QID124": {
                "type": "html",
                "name": "QID124",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_81vUDpE2fQqIyj3\"></div>",
                "isRequired": false
            }
        },
        {
            "QID153": {
                "type": "html",
                "name": "QID153",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_daT4Usr05StpVhr\"></div>",
                "isRequired": false
            }
        },
        {
            "QID142": {
                "type": "html",
                "name": "QID142",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_4T5MIcTxr6GPXBX\"></div>",
                "isRequired": false
            }
        },
        {
            "QID143": {
                "type": "html",
                "name": "QID143",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cOMFom5VcJpmkzr\"></div>",
                "isRequired": false
            }
        },
        {
            "QID144": {
                "type": "html",
                "name": "QID144",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3CKRnacZh47x2Nn\"></div>",
                "isRequired": false
            }
        },
        {
            "QID145": {
                "type": "html",
                "name": "QID145",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5083djzo4Jip0Vv\"></div>",
                "isRequired": false
            }
        },
        {
            "QID146": {
                "type": "html",
                "name": "QID146",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3aaW2Q5UHpVhnDL\"></div>",
                "isRequired": false
            }
        },
        {
            "QID147": {
                "type": "html",
                "name": "QID147",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_cBkclL7jqGAetDL\"></div>",
                "isRequired": false
            }
        },
        {
            "QID148": {
                "type": "html",
                "name": "QID148",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0IjO9fOvXEmUYsd\"></div>",
                "isRequired": false
            }
        },
        {
            "QID149": {
                "type": "html",
                "name": "QID149",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_86r2hkzT2ClrXZX\"></div>",
                "isRequired": false
            }
        },
        {
            "QID150": {
                "type": "html",
                "name": "QID150",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_6YlVWZsNGr670fX\"></div>",
                "isRequired": false
            }
        },
        {
            "QID151": {
                "type": "html",
                "name": "QID151",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9GeyNIgxpIsnPmZ\"></div>",
                "isRequired": false
            }
        },
        {
            "QID167": {
                "type": "html",
                "name": "QID167",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3OxijTxemcufwIl\"></div>",
                "isRequired": false
            }
        },
        {
            "QID219": {
                "type": "html",
                "name": "QID219",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9TWOVAAC43JvJ65\"></div>",
                "isRequired": false
            }
        },
        {
            "QID169": {
                "type": "html",
                "name": "QID169",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_5heJgRBnd8TAFVz\"></div>",
                "isRequired": false
            }
        },
        {
            "QID170": {
                "type": "html",
                "name": "QID170",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_baoTFDe5fBdfwd7\"></div>",
                "isRequired": false
            }
        },
        {
            "QID171": {
                "type": "html",
                "name": "QID171",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_etbcRN8Wks1AkwB\"></div>",
                "isRequired": false
            }
        },
        {
            "QID172": {
                "type": "html",
                "name": "QID172",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bfmY33Zjl0TGfTT\"></div>",
                "isRequired": false
            }
        },
        {
            "QID173": {
                "type": "html",
                "name": "QID173",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3kFuW7ZP8l51jOl\"></div>",
                "isRequired": false
            }
        },
        {
            "QID174": {
                "type": "html",
                "name": "QID174",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_2c4hfdkIpkqQbA1\"></div>",
                "isRequired": false
            }
        },
        {
            "QID175": {
                "type": "html",
                "name": "QID175",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bCojXxQzmz2zzXD\"></div>",
                "isRequired": false
            }
        },
        {
            "QID176": {
                "type": "html",
                "name": "QID176",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eEzOW7WuXaO4WlD\"></div>",
                "isRequired": false
            }
        },
        {
            "QID177": {
                "type": "html",
                "name": "QID177",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eUT9ECwCyIXvYRD\"></div>",
                "isRequired": false
            }
        },
        {
            "QID192": {
                "type": "html",
                "name": "QID192",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_bdyIJvpU5ua0Yvj\"></div>",
                "isRequired": false
            }
        },
        {
            "QID193": {
                "type": "html",
                "name": "QID193",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9H2Z5MvSZp82Bet\"></div>",
                "isRequired": false
            }
        },
        {
            "QID194": {
                "type": "html",
                "name": "QID194",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_eamyJGcBtm3drLf\"></div>",
                "isRequired": false
            }
        },
        {
            "QID195": {
                "type": "html",
                "name": "QID195",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8B9TJbTI8gjReol\"></div>",
                "isRequired": false
            }
        },
        {
            "QID196": {
                "type": "html",
                "name": "QID196",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1ACankibzBdbf9z\"></div>",
                "isRequired": false
            }
        },
        {
            "QID197": {
                "type": "html",
                "name": "QID197",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_0vcglYQRggVLLlX\"></div>",
                "isRequired": false
            }
        },
        {
            "QID198": {
                "type": "html",
                "name": "QID198",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_3Wa4Q28agDc0ezj\"></div>",
                "isRequired": false
            }
        },
        {
            "QID199": {
                "type": "html",
                "name": "QID199",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_00Y3pLzoq8fHygB\"></div>",
                "isRequired": false
            }
        },
        {
            "QID201": {
                "type": "html",
                "name": "QID201",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_9XmIXuB7ShjM44d\"></div>",
                "isRequired": false
            }
        },
        {
            "QID202": {
                "type": "html",
                "name": "QID202",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_8iXqRhRNNuEF0H3\"></div>",
                "isRequired": false
            }
        },
        {
            "QID222": {
                "type": "html",
                "name": "QID222",
                "html": "<div><img src=\"https://iad1.qualtrics.com/WRQualtricsControlPanel_rel/Graphic.php?IM=IM_1Y17QYhFl7uhe97\"></div>",
                "isRequired": false
            }
        }
    ],
    "surveyFlow": {
        "name": "root",
        "type": "SEQUENTIAL_GROUP",
        "nodes": [
            {
                "type": "QUESTION_BLOCK",
                "surveyIdx": 0
            },
            {
                "type": "VARIABLES",
                "dataIdx": 0
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "VARIABLES",
                        "dataIdx": 1
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 2
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 3
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 4
                    }
                ]
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "VARIABLES",
                        "dataIdx": 5
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 6
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 7
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 8
                    }
                ]
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "VARIABLES",
                        "dataIdx": 9
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 10
                    }
                ]
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "VARIABLES",
                        "dataIdx": 11
                    },
                    {
                        "type": "VARIABLES",
                        "dataIdx": 12
                    }
                ]
            },
            {
                "type": "QUESTION_BLOCK",
                "surveyIdx": 2
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "IF_THEN_ELSE_GROUP",
                        "condition": "arrayContains({QID2}, \"1\")",
                        "nodes": [
                            {
                                "type": "SEQUENTIAL_GROUP",
                                "nodes": [
                                    {
                                        "type": "SHUFFLE_GROUP",
                                        "nodes": [
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 26
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 27
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 28
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 25
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 30
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 29
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 31
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 32
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 33
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 34
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 35
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 19
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{p1}=1",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 11
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 16
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 3
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 10
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{n1}=1",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 12
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 4
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 15
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 7
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "QUESTION_BLOCK",
                                        "surveyIdx": 5
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "IF_THEN_ELSE_GROUP",
                        "condition": "arrayContains({QID2}, \"1\")",
                        "nodes": [
                            {
                                "type": "SEQUENTIAL_GROUP",
                                "nodes": [
                                    {
                                        "type": "SHUFFLE_GROUP",
                                        "nodes": [
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 36
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 37
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 38
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 39
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 40
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 41
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 42
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 43
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 44
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 45
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 46
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 22
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{p2}=1",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 11
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 16
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 3
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 10
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{n2}=1",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 12
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 4
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 15
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 7
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "QUESTION_BLOCK",
                                        "surveyIdx": 8
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "IF_THEN_ELSE_GROUP",
                        "condition": "arrayContains({QID2}, \"1\")",
                        "nodes": [
                            {
                                "type": "SEQUENTIAL_GROUP",
                                "nodes": [
                                    {
                                        "type": "SHUFFLE_GROUP",
                                        "nodes": [
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 47
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 48
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 49
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 50
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 51
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 52
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 53
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 54
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 55
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 56
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 57
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 23
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{p1}=2",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 11
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 16
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 3
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 10
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{n1}=2",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 12
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 4
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 15
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf2}<=2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 7
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "QUESTION_BLOCK",
                                        "surveyIdx": 14
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "IF_THEN_ELSE_GROUP",
                        "condition": "arrayContains({QID2}, \"1\")",
                        "nodes": [
                            {
                                "type": "SEQUENTIAL_GROUP",
                                "nodes": [
                                    {
                                        "type": "SHUFFLE_GROUP",
                                        "nodes": [
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 58
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 59
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 60
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 61
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 62
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 63
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 64
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 65
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 66
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 67
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 68
                                            },
                                            {
                                                "type": "QUESTION_BLOCK",
                                                "surveyIdx": 24
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{p2}=2",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 11
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 16
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 3
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 10
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "IF_THEN_ELSE_GROUP",
                                        "condition": "{n2}=2",
                                        "nodes": [
                                            {
                                                "type": "SHUFFLE_GROUP",
                                                "nodes": [
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{bin2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 12
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{mall2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 4
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{letterbox2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 15
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "IF_THEN_ELSE_GROUP",
                                                        "condition": "{graf2}>2",
                                                        "nodes": [
                                                            {
                                                                "type": "QUESTION_BLOCK",
                                                                "surveyIdx": 7
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "QUESTION_BLOCK",
                                        "surveyIdx": 17
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "type": "QUESTION_BLOCK",
                "surveyIdx": 1
            },
            {
                "type": "QUESTION_BLOCK",
                "surveyIdx": 18
            },
            {
                "type": "SHUFFLE_GROUP",
                "nodes": [
                    {
                        "type": "SEQUENTIAL_GROUP",
                        "nodes": [
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 26
                            },
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 27
                            },
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 28
                            }
                        ]
                    },
                    {
                        "type": "SEQUENTIAL_GROUP",
                        "nodes": [
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 29
                            },
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 30
                            },
                            {
                                "type": "QUESTION_BLOCK",
                                "surveyIdx": 31
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "surveySettings": {
        "showPrevButton": false
    },
    "surveyRunLogic": {},
    "inQuestionRandomization": {},
    "questionsOrderRandomization": [],
    "questionSkipLogic": {},
    "questionsConverted": 148,
    "questionsTotal": 149,
    "logs": [
        {
            "origin": "[qsf preprocessing]",
            "msg": "plain text preprocessing took 2.399999976158142",
            "level": "info"
        },
        {
            "origin": "question: QID234",
            "msg": "no converter is currently available for question type DB | FLB",
            "level": "warn"
        },
        {
            "origin": "[qsf converter]",
            "msg": "flow parse took: 1.2000000476837158 ms",
            "level": "info"
        },
        {
            "origin": "[qsf converter]",
            "msg": "import took: 5.40 ms",
            "level": "info"
        }
    ]
}

const CAPTIONS = {
	NEXT: "Next"
};

const SURVEY_SETTINGS = {
	minWidth: "100px"
};

const SURVEY_COMPLETION_CODES =
{
	NORMAL: 0,
	SKIP_TO_END_OF_BLOCK: 1,
	SKIP_TO_END_OF_SURVEY: 2
};

/**
 * Survey Stimulus.
 *
 * @extends VisualStim
 */
export class Survey extends VisualStim
{
	static SURVEY_EXPERIMENT_PARAMETERS = ["surveyId", "showStartDialog", "showEndDialog", "completionUrl", "cancellationUrl", "quitOnEsc"];

	static SURVEY_FLOW_PLAYBACK_TYPES =
	{
		DIRECT: "QUESTION_BLOCK",
		CONDITIONAL: "IF_THEN_ELSE_GROUP",
		EMBEDDED_DATA: "VARIABLES",
		RANDOMIZER: "RANDOM_GROUP",
		SEQUENTIAL: "SEQUENTIAL_GROUP",
		ENDSURVEY: "END"
	};

	/**
	 * @memberOf module:visual
	 * @param {Object} options
	 * @param {String} options.name - the name used when logging messages from this stimulus
	 * @param {Window} options.win - the associated Window
	 * @param {string} [options.surveyId] - the survey id
	 * @param {Object | string} [options.model] - the survey model
	 * @param {string} [options.units= "norm"] - the units of the stimulus (e.g. for size, position, vertices)
	 * @param {Array.<number>} [options.pos= [0, 0]] - the position of the center of the stimulus
	 * @param {number} [options.ori= 0.0] - the orientation (in degrees)
	 * @param {number} [options.size] - the size of the rendered survey
	 * @param {number} [options.depth= 0] - the depth (i.e. the z order)
	 * @param {boolean} [options.autoDraw= false] - whether  the stimulus should be automatically drawn
	 * 	on every frame flip
	 * @param {boolean} [options.autoLog= false] - whether to log
	 */
	constructor({ name, win, model, surveyId, pos, units, ori, size, depth, autoDraw, autoLog } = {})
	{
		super({ name, win, units, ori, depth, pos, size, autoDraw, autoLog });

		// the default surveyId is an uuid based on the experiment id (or name) and the survey name:
		// this way, it is always the same within a given experiment
		this._hasSelfGeneratedSurveyId = (typeof surveyId === "undefined");
		const defaultSurveyId = (this._psychoJS.getEnvironment() === ExperimentHandler.Environment.SERVER) ?
			util.makeUuid(`${name}@${this._psychoJS.config.gitlab.projectId}`) :
			util.makeUuid(`${name}@${this._psychoJS.config.experiment.name}`);

		// whether the user is done with the survey, independently of whether the survey is completed:
		this.isFinished = false;

		// Accumulated completion flag that is being set after completion of one survey node.
		// This flag allows to track completion progress while moving through the survey flow.
		// Initially set to true and will be flipped if at least one of the survey nodes were not fully completed.
		this._isCompletedAll = true;

		// timestamps associated to each question:
		this._questionAnswerTimestamps = {};
		// timestamps clock:
		this._questionAnswerTimestampClock = new Clock();

		this._totalSurveyResults = {};
		this._surveyData = undefined;
		this._surveyModel = undefined;
		this._signaturePadRO = undefined;
		this._expressionsRunner = undefined;
		this._lastPageSwitchHandledIdx = -1;
		this._variables = {};

		this._surveyRunningPromise = undefined;
		this._surveyRunningPromiseResolve = undefined;
		this._surveyRunningPromiseReject = undefined;

		// callback triggered when the user is done with the survey: nothing to do by default
		this._onFinishedCallback = () => {};

		// init SurveyJS
		this._initSurveyJS();

		this._addAttribute(
			"model",
			model
		);
		this._addAttribute(
			"surveyId",
			surveyId,
			defaultSurveyId
		);

		// estimate the bounding box:
		this._estimateBoundingBox();

		if (this._autoLog)
		{
			this._psychoJS.experimentLogger.exp(`Created ${this.name} = ${this.toString()}`);
		}
	}

	get isCompleted ()
	{
		return this.isFinished && this._isCompletedAll;
	}

	/**
	 * Setter for the model attribute.
	 *
	 * @param {Object | string} model - the survey model
	 * @param {boolean} [log= false] - whether to log
	 * @return {void}
	 */
	setModel(model, log = false)
	{
		const response = {
			origin: "Survey.setModel",
			context: `when setting the model of Survey: ${this._name}`,
		};

		try
		{
			// model is undefined: that's fine, but we raise a warning in case this is a symptom of an actual problem
			if (typeof model === "undefined")
			{
				this.psychoJS.logger.warn(`setting the model of Survey: ${this._name} with argument: undefined.`);
				this.psychoJS.logger.debug(`set the model of Survey: ${this._name} as: undefined`);
			}
			else
			{
				// model is a string: it should be the name of a resource, which we load
				if (typeof model === "string")
				{
					const encodedModel = this.psychoJS.serverManager.getResource(model);
					const decodedModel = new TextDecoder("utf-8").decode(encodedModel);
					model = JSON.parse(decodedModel);
				}

				// items should now be an object:
				if (typeof model !== "object")
				{
					throw "model is neither the name of a resource nor an object";
				}

				// this._surveyData = model;
				this._surveyData = SD;
				// this._surveyModel = new window.Survey.Model(this._surveyModelJson);
				// this._surveyModel.isInitialized = false;

				// custom css:
				// see https://surveyjs.io/form-library/examples/survey-cssclasses/jquery#content-js

				this._setAttribute("model", model, log);
				this._onChange(true, true)();
			}
		}
		catch (error)
		{
			throw { ...response, error };
		}
	}

	/**
	 * Set survey variables.
	 *
	 * @param {Object} variables - an object with a number of variable name/variable value pairs
	 * @param {string[]} [excludedNames={}] - excluded variable names
	 * @return {void}
	 */
	setVariables(variables, excludedNames)
	{
		// filter the variables and set them:
		// const filteredVariables = {};
		// for (const name in variables)
		// {
		// 	if (excludedNames.indexOf(name) === -1)
		// 	{
		// 		filteredVariables[name] = variables[name];
		// 		this._surveyModel.setVariable(name, variables[name]);
		// 	}
		// }

		// // set the values:
		// this._surveyModel.mergeData(filteredVariables);

		for (const name in variables)
		{
			if (excludedNames.indexOf(name) === -1)
			{
				this._surveyData.variables[name] = variables[name];
			}
		}
	}

	/**
	 * Evaluate an expression, taking into account the survey responses.
	 *
	 * @param {string} expression - the expression to evaluate
	 * @returns {any} the evaluated expression
	 */
	evaluateExpression(expression)
	{
		if (typeof expression === "undefined" || typeof this._surveyModel === "undefined")
		{
			return undefined;
		}

		// modify the expression when it is a simple URL, without variables
		// i.e. when there is no quote and no brackets
		if (expression.indexOf("'") === -1 && expression.indexOf("{") === -1)
		{
			expression = `'${expression}'`;
		}

		return this._surveyModel.runExpression(expression);
	}

	/**
	 * Setter for the surveyId attribute.
	 *
	 * @param {string} surveyId - the survey Id
	 * @param {boolean} [log= false] - whether to log
	 * @return {void}
	 */
	setSurveyId(surveyId, log = false)
	{
		this._setAttribute("surveyId", surveyId, log);
		if (!this._hasSelfGeneratedSurveyId)
		{
			this.setModel(`${surveyId}.sid`, log);
		}
	}

	/**
	 * Add a callback that will be triggered when the participant finishes the survey.
	 *
	 * @param callback - callback triggered when the participant finishes the survey
	 * @return {void}
	 */
	onFinished(callback)
	{
		if (typeof this._surveyData === "undefined")
		{
			throw {
				origin: "Survey.onFinished",
				context: "when setting a callback triggered when the participant finishes the survey",
				error: "the survey does not have a model"
			};
		}

		// note: we cannot simply add the callback to surveyModel.onComplete since we first need
		// to run _onSurveyComplete in order to collect data, estimate whether the survey is complete, etc.
		if (typeof callback === "function")
		{
			this._onFinishedCallback = callback;
		}
		// this._surveyModel.onComplete.add(callback);
	}

	/**
	 * Get the survey response.
	 */
	getResponse()
	{
		// if (typeof this._surveyModel === "undefined")
		// {
		// 	return {};
		// }

		// return this._surveyModel.data;

		return this._totalSurveyResults;
	}

	/**
	 * Upload the survey response to the pavlovia.org server.
	 *
	 * @returns {Promise<ServerManager.UploadDataPromise>} a promise resolved when the survey response
	 * 	has been saved
	 */
	save()
	{
		this._psychoJS.logger.info("[PsychoJS] Save survey response.");

		// get the survey response and complement it with experimentInfo fields:
		const response = this.getResponse();
		for (const field in this.psychoJS.experiment.extraInfo)
		{
			if (Survey.SURVEY_EXPERIMENT_PARAMETERS.indexOf(field) === -1)
			{
				response[field] = this.psychoJS.experiment.extraInfo[field];
			}
		}

		// add timing information:
		for (const question in this._questionAnswerTimestamps)
		{
			response[`${question}_rt`] = this._questionAnswerTimestamps[question].timestamp;
		}

		// sort the questions and question response times alphabetically:
		const sortedResponses = Object.keys(response).sort().reduce( (sorted, key) =>
			{
				sorted[key] = response[key];
				return sorted;
			},
			{}
		);


		// if the response cannot be uploaded, e.g. the experiment is running locally, or
		// if it is piloting mode, then we offer the response as a file for download:
		if (this._psychoJS.getEnvironment() !== ExperimentHandler.Environment.SERVER ||
			this._psychoJS.config.experiment.status !== "RUNNING" ||
			this._psychoJS._serverMsg.has("__pilotToken"))
		{
			const filename = `survey_${this._surveyId}.json`;
			const blob = new Blob([JSON.stringify(sortedResponses)], { type: "application/json" });

			const anchor = document.createElement("a");
			anchor.href = window.URL.createObjectURL(blob);
			anchor.download = filename;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);

			return Promise.resolve({});
		}

		// otherwise, we do upload the survey response
		// note: if the surveyId was self-generated instead of being a parameter of the constructor,
		// we need to also upload the survey model, as a new survey might need to be created on the fly
		// by the server for this experiment.
		if (!this._hasSelfGeneratedSurveyId)
		{
			return this._psychoJS.serverManager.uploadSurveyResponse(
				this._surveyId, sortedResponses, this.isCompleted
			);
		}
		else
		{
			return this._psychoJS.serverManager.uploadSurveyResponse(
				this._surveyId, sortedResponses, this.isCompleted, this._surveyData
			);
		}
	}

	/**
	 * Hide this stimulus on the next frame draw.
	 *
	 * @override
	 * @note We over-ride MinimalStim.hide such that we can remove the survey DOM element
	 */
	hide()
	{
		// if a survey div already does not exist already, create it:
		const surveyId = `survey-${this._name}`;
		const surveyDiv = document.getElementById(surveyId);
		if (surveyDiv !== null)
		{
			document.body.removeChild(surveyDiv);
		}

		super.hide();
	}

	/**
	 * Estimate the bounding box.
	 *
	 * @override
	 * @protected
	 */
	_estimateBoundingBox()
	{
		this._boundingBox = new PIXI.Rectangle(
			this._pos[0] - this._size[0] / 2,
			this._pos[1] - this._size[1] / 2,
			this._size[0],
			this._size[1],
		);

		// TODO take the orientation into account
	}

	/**
	 * Update the stimulus, if necessary.
	 *
	 * @protected
	 */
	_updateIfNeeded()
	{
		if (!this._needUpdate)
		{
			return;
		}
		this._needUpdate = false;

		// update the PIXI representation, if need be:
		if (this._needPixiUpdate)
		{
			this._needPixiUpdate = false;

			// if a survey div does not exist, create it:
			if (document.getElementById("_survey") === null)
			{
				document.body.insertAdjacentHTML("beforeend", "<div id='_survey' class='survey'></div>")
			}

			// start the survey flow:
			if (typeof this._surveyData !== "undefined")
			{
				// this._startSurvey(surveyId, this._surveyModel);
				// jQuery(`#${surveyId}`).Survey({model: this._surveyModel});

				this._runSurveyFlow(this._surveyData.surveyFlow, this._surveyData);
			}
		}

		// TODO change the position, scale, anchor, z-index, etc.
		// TODO update the size, taking into account the actual size of the survey
		/*
		this._pixi.zIndex = -this._depth;
		this._pixi.alpha = this.opacity;

		// set the scale:
		const displaySize = this._getDisplaySize();
		const size_px = util.to_px(displaySize, this.units, this.win);
		const scaleX = size_px[0] / this._texture.width;
		const scaleY = size_px[1] / this._texture.height;
		this._pixi.scale.x = this.flipHoriz ? -scaleX : scaleX;
		this._pixi.scale.y = this.flipVert ? scaleY : -scaleY;

		// set the position, rotation, and anchor (image centered on pos):
		this._pixi.position = to_pixiPoint(this.pos, this.units, this.win);
		this._pixi.rotation = -this.ori * Math.PI / 180;
		this._pixi.anchor.x = 0.5;
		this._pixi.anchor.y = 0.5;
*/
	}

	/**
	 * Register custom SurveyJS expression functions.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerCustomExpressionFunctions (Survey, customFuncs = [])
	{
		let i;
		for (i = 0; i < customFuncs.length; i++)
		{
			Survey.FunctionFactory.Instance.register(customFuncs[i].func.name, customFuncs[i].func, customFuncs[i].isAsync);
		}
	}

	/**
	 * Register SurveyJS widgets.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerWidgets(Survey)
	{
		registerSelectBoxWidget(Survey);
		registerSliderWidget(Survey);
		registerSideBySideMatrix(Survey);
		registerMaxDiffMatrix(Survey);
		registerSliderStar(Survey);

		// load the widget style:
		// TODO
		// util.loadCss("./survey/css/widgets.css");
	}

	/**
	 * Register custom Survey properties. Usially these are relevant for different question types.
	 *
	 * @protected
	 * @return {void}
	 */
	_registerCustomSurveyProperties(Survey)
	{
		MatrixBipolar.registerSurveyProperties(Survey);
		Survey.Serializer.addProperty("signaturepad", {
			name: "maxSignatureWidth",
			type: "number",
			default: 500
		});
	}

	_registerCustomComponentCallbacks(surveyModel)
	{
		MatrixBipolar.registerModelCallbacks(surveyModel);
		DropdownExtensions.registerModelCallbacks(surveyModel);
	}

	/**
	 * Callback triggered whenever the participant answer a question.
	 *
	 * @param survey
	 * @param questionData
	 * @protected
	 */
	_onQuestionValueChanged(survey, questionData)
	{
		if (typeof this._questionAnswerTimestamps[questionData.name] === "undefined")
		{
			this._questionAnswerTimestamps[questionData.name] = {
				timestamp: 0
			};
		}
		this._questionAnswerTimestamps[questionData.name].timestamp = this._questionAnswerTimestampClock.getTime();
	}

	// This probably needs to be moved to some kind of utils.js.
	// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	_FisherYatesShuffle (targetArray = [])
	{
		// Copying array to preserve initial data.
		const out = Array.from(targetArray);
		const len = targetArray.length;
		let i, j, k;
		for (i = len - 1; i >= 1; i--)
		{
			j = Math.floor(Math.random() * (i + 1));
			k = out[j];
			out[j] = out[i];
			out[i] = k;
		}

		return out;
	}

	// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
	_InPlaceFisherYatesShuffle (inOutArray = [], startIdx, endIdx)
	{
		// Shuffling right in the input array.
		let i, j, k;
		for (i = endIdx; i >= startIdx; i--)
		{
			j = Math.floor(Math.random() * (i + 1));
			k = inOutArray[j];
			inOutArray[j] = inOutArray[i];
			inOutArray[i] = k;
		}

		return inOutArray;
	}

	_composeModelWithRandomizedQuestions (surveyModel, inBlockRandomizationSettings)
	{
		let t = performance.now();
		// Qualtrics's in-block randomization ignores presense of page breaks within the block.
		// Hence creating a fresh survey data object with shuffled question order.
		let questions = [];
		let questionsMap = {};
		let shuffledQuestions;
		let newSurveyModel =
		{
			pages:[{ elements: new Array(inBlockRandomizationSettings.questionsPerPage) }]
		};
		let i, j, k;
		for (i = 0; i < surveyModel.pages.length; i++)
		{
			for (j = 0; j < surveyModel.pages[i].elements.length; j++)
			{
				questions.push(surveyModel.pages[i].elements[j]);
				k = questions.length - 1;
				questionsMap[questions[k].name] = questions[k];
			}
		}

		if (inBlockRandomizationSettings.layout.length > 0)
		{
			j = 0;
			k = 0;
			let curPage = 0;
			let curElement = 0;
			const shuffledSet0 = this._FisherYatesShuffle(inBlockRandomizationSettings.set0);
			const shuffledSet1 = this._FisherYatesShuffle(inBlockRandomizationSettings.set1);
			for (i = 0; i < inBlockRandomizationSettings.layout.length; i++)
			{
				// Create new page if questionsPerPage reached.
				if (curElement === inBlockRandomizationSettings.questionsPerPage)
				{
					newSurveyModel.pages.push({ elements: new Array(inBlockRandomizationSettings.questionsPerPage) });
					curPage++;
					curElement = 0;
				}

				if (inBlockRandomizationSettings.layout[i] === "set0")
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[shuffledSet0[j]];
					j++;
				}
				else if (inBlockRandomizationSettings.layout[i] === "set1")
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[shuffledSet1[k]];
					k++;
				}
				else
				{
					newSurveyModel.pages[curPage].elements[curElement] = questionsMap[inBlockRandomizationSettings.layout[i]];
				}
				curElement++;
			}
		}
		else if (inBlockRandomizationSettings.showOnly > 0)
		{
			// TODO: Check if there can be questionsPerPage applicable in this case.
			shuffledQuestions = this._FisherYatesShuffle(questions);
			newSurveyModel.pages[0].elements = shuffledQuestions.splice(0, inBlockRandomizationSettings.showOnly);
		}
		else {
			// TODO: Check if there can be questionsPerPage applicable in this case.
			newSurveyModel.pages[0].elements = this._FisherYatesShuffle(questions);
		}
		console.log("model recomposition took", performance.now() - t);
		console.log("recomposed model:", newSurveyModel);
		return newSurveyModel;
	}

	_applyInQuestionRandomization (questionData, inQuestionRandomizationSettings, surveyData)
	{
		let t = performance.now();
		let choicesFieldName;
		let valueFieldName;
		if (questionData.rows !== undefined)
		{
			choicesFieldName = "rows";
			valueFieldName = "value";
		}
		else if (questionData.choices !== undefined)
		{
			choicesFieldName = "choices";
			valueFieldName = "value";
		}
		else if (questionData.items !== undefined)
		{
			choicesFieldName = "items";
			valueFieldName = "name";
		}
		else
		{
			console.log("[Survey runner]: Uknown choicesFieldName for", questionData);
		}

		if (inQuestionRandomizationSettings.randomizeAll)
		{
			questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]);
			// Handle dynamic choices.
		}
		else if (inQuestionRandomizationSettings.showOnly > 0)
		{
			questionData[choicesFieldName] = this._FisherYatesShuffle(questionData[choicesFieldName]).splice(0, inQuestionRandomizationSettings.showOnly);
		}
		else if (inQuestionRandomizationSettings.reverse)
		{
			questionData[choicesFieldName] = Math.round(Math.random()) === 1 ? questionData[choicesFieldName].reverse() : questionData[choicesFieldName];
		}
		else if (inQuestionRandomizationSettings.layout.length > 0)
		{
			const initialChoices = questionData[choicesFieldName];
			let choicesMap = {};
			// TODO: generalize further i.e. figure out how to calculate the length of array based on availability of sets.
			const setIndices = [0, 0, 0];
			let i;
			for (i = 0; i < questionData[choicesFieldName].length; i++)
			{
				choicesMap[questionData[choicesFieldName][i][valueFieldName]] = questionData[choicesFieldName][i];
			}

			// Creating new array of choices to which we're going to write from randomized/reversed sets.
			questionData[choicesFieldName] = new Array(inQuestionRandomizationSettings.layout.length);
			const shuffledSet0 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set0);
			const shuffledSet1 = this._FisherYatesShuffle(inQuestionRandomizationSettings.set1);
			const reversedSet = Math.round(Math.random()) === 1 ? inQuestionRandomizationSettings.reverseOrder.reverse() : inQuestionRandomizationSettings.reverseOrder;
			for (i = 0; i < inQuestionRandomizationSettings.layout.length; i++)
			{
				if (inQuestionRandomizationSettings.layout[i] === "set0")
				{
					questionData[choicesFieldName][i] = choicesMap[shuffledSet0[ setIndices[0] ]];
					setIndices[0]++;
				}
				else if (inQuestionRandomizationSettings.layout[i] === "set1")
				{
					questionData[choicesFieldName][i] = choicesMap[shuffledSet1[ setIndices[1] ]];
					setIndices[1]++;
				}
				else if (inQuestionRandomizationSettings.layout[i] === "reverseOrder")
				{
					questionData[choicesFieldName][i] = choicesMap[reversedSet[ setIndices[2] ]];
					setIndices[2]++;
				}
				else
				{
					questionData[choicesFieldName][i] = choicesMap[inQuestionRandomizationSettings.layout[i]];
				}
			}

			if (inQuestionRandomizationSettings.layout.length < initialChoices.length)
			{
				// Compose unused choices set.
				// TODO: This is potentially how data loss can be avoided and thus no need to deepcopy model.
				if (surveyData.unusedChoices === undefined)
				{
					surveyData.unusedChoices = {};
				}
				surveyData.unusedChoices[questionData.name] = {
					// All other sets are always used entirely.
					set1: shuffledSet1.splice(setIndices[1], shuffledSet1.length)
				};
				console.log("unused choices", questionData.name, surveyData.unusedChoices[questionData.name]);
			}
		}

		console.log("applying question randomization took", performance.now() - t);
		// console.log(questionData);
	}

	/**
	 * @desc: Go over required surveyModelData and apply randomization settings.
	 */
	_processSurveyData (surveyData, surveyIdx)
	{
		let t = performance.now();
		let i, j;
		let newSurveyModel = undefined;
		if (surveyData.questionsOrderRandomization[surveyIdx] !== undefined)
		{
			// Qualtrics's in-block randomization ignores presense of page breaks within the block.
			// Hence creating a fresh survey data object with shuffled question order.
			newSurveyModel = this._composeModelWithRandomizedQuestions(surveyData.surveys[surveyIdx], surveyData.questionsOrderRandomization[surveyIdx]);
		}

		// Checking if there's in-question randomization that needs to be applied.
		for (i = 0; i < surveyData.surveys[surveyIdx].pages.length; i++)
		{
			for (j = 0; j < surveyData.surveys[surveyIdx].pages[i].elements.length; j++)
			{
				if (surveyData.inQuestionRandomization[surveyData.surveys[surveyIdx].pages[i].elements[j].name] !== undefined)
				{
					if (newSurveyModel === undefined)
					{
						// Marking a deep copy of survey model input data, to avoid data loss if randomization returns a subset of choices.
						// TODO: think of somehting more optimal.
						newSurveyModel = JSON.parse(JSON.stringify(surveyData.surveys[surveyIdx]));
					}
					this._applyInQuestionRandomization(
						newSurveyModel.pages[i].elements[j],
						surveyData.inQuestionRandomization[newSurveyModel.pages[i].elements[j].name],
						surveyData
					);
				}
			}
		}

		if (newSurveyModel === undefined)
		{
			// No changes were made, just return original data.
			newSurveyModel = surveyData.surveys[surveyIdx];
		}
		console.log("survey model preprocessing took", performance.now() - t);
		return newSurveyModel;
	}

	/**
	 * Callback triggered when the participant changed the page.
	 *
	 * @protected
	 */
	_onCurrentPageChanging (surveyModel, options)
	{
		if (this._lastPageSwitchHandledIdx === options.oldCurrentPage.visibleIndex)
		{
			// When surveyModel.currentPage is called from this handler, pagechange event gets triggered again.
			// Hence returning if we already handled this pagechange to avoid max callstack exceeded errors.
			return;
		}
		this._lastPageSwitchHandledIdx = options.oldCurrentPage.visibleIndex;
		const questions = surveyModel.getCurrentPageQuestions();

		// It is guaranteed that the question with skip logic is always last on the page.
		const lastQuestion = questions[questions.length - 1];
		const skipLogic = this._surveyData.questionSkipLogic[lastQuestion.name];
		if (skipLogic !== undefined)
		{
			this._expressionsRunner.expressionExecutor.setExpression(skipLogic.expression);
			const result = this._expressionsRunner.run(surveyModel.data);
			if (result)
			{
				options.allowChanging = false;

				if (skipLogic.destination === "ENDOFSURVEY")
				{
					surveyModel.setCompleted();
					this._surveyRunningPromiseResolve(SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY);
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					surveyModel.setCompleted();
					this._surveyRunningPromiseResolve(SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK);
				}
				else
				{
					// skipLogic.destination is a question within the current survey (qualtrics block).
					const targetQuestion = surveyModel.getQuestionByName(skipLogic.destination);
					const page = surveyModel.getPageByQuestion(targetQuestion);
					const pageQuestions = page.questions;
					let i;
					for (i = 0; i < pageQuestions.length; i++)
					{
						if (pageQuestions[i] === targetQuestion)
						{
							break;
						}
						pageQuestions[i].visible = false;
					}
					targetQuestion.focus();
					surveyModel.currentPage = page;
				}
			}
		}
	}

	/**
	 * Callback triggered when the participant is done with the survey, i.e. when the
	 * [Complete] button as been pressed.
	 *
	 * @param surveyModel
	 * @param options
	 * @private
	 */
	_onSurveyComplete(surveyModel, options)
	{
		console.log(this._questionAsnwerTimestamps);
		Object.assign(this._totalSurveyResults, surveyModel.data);
		console.log("survey complete", this._totalSurveyResults);
		this._detachResizeObservers();
		let completionCode = SURVEY_COMPLETION_CODES.NORMAL;
		const questions = surveyModel.getAllQuestions();

		// It is guaranteed that the question with skip logic is always last on the page.
		const lastQuestion = questions[questions.length - 1];
		const skipLogic = this._surveyData.questionSkipLogic[lastQuestion.name];
		if (skipLogic !== undefined)
		{
			this._expressionsRunner.expressionExecutor.setExpression(skipLogic.expression);
			const result = this._expressionsRunner.run(surveyModel.data);
			if (result)
			{
				if (skipLogic.destination === "ENDOFSURVEY")
				{
					completionCode = SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY;
					surveyModel.setCompleted();
				}
				else if (skipLogic.destination === "ENDOFBLOCK")
				{
					completionCode = SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_BLOCK;
				}
			}
		}

		surveyModel.stopTimer();

		// check whether the survey was completed:
		const surveyVisibleQuestions = this._surveyModel.getAllQuestions(true);
		const nbAnsweredQuestions = surveyVisibleQuestions.reduce(
			(count, question) =>
			{
				// note: the response of a html, ranking, checkbox, or comment question is empty if the user
				// did not interact with it
				const type = question.getType();
				if (type === "html" ||
					type === "ranking" ||
					type === "checkbox" ||
					type === "comment" ||
					!question.isEmpty())
				{
					return count + 1;
				}
				else
				{
					return count;
				}
			},
			0
		);
		this._isCompletedAll = this._isCompletedAll && (nbAnsweredQuestions === surveyVisibleQuestions.length);
		if (this._isCompletedAll === false)
		{
			this.psychoJS.logger.warn(`Flag _isCompletedAll is false!`);
		}

		this._surveyRunningPromiseResolve(completionCode);
	}

	_onFlowComplete ()
	{
		this.isFinished = true;
		this._onFinishedCallback();
	}

	_onTextMarkdown(survey, options)
	{
		// TODO add sanitization / checks if required.
		options.html = options.text;
	}

	/**
	 * Run the survey using flow data provided. This method runs recursively.
	 *
	 * @protected
	 * @param {string} surveyId - the id of the DOM div
	 * @param {Object} surveyData - surveyData / model.
	 * @param {Object} prevBlockResults - survey results gathered from running previous block of questions.
	 * @return {void}
	 */
	_beginSurvey (surveyData, surveyFlowBlock)
	{
		let j;
		let surveyIdx;
		this._lastPageSwitchHandledIdx = -1;
		surveyIdx = surveyFlowBlock.surveyIdx;
		console.log("playing survey with idx", surveyIdx);
		let surveyModelInput = this._processSurveyData(surveyData, surveyIdx);

		this._surveyModel = new window.Survey.Model(surveyModelInput);
		for (j in this._variables)
		{
			// Adding variables directly to hash to get higher performance (this is instantaneous compared to .setVariable()).
			// At this stage we don't care to trigger all the callbacks like .setVariable() does, since this is very beginning of survey presentation.
			this._surveyModel.variablesHash[j] = this._variables[j];
			// this._surveyModel.setVariable(j, this._variables[j]);
		}

		if (!this._surveyModel.isInitialized)
		{
			this._registerCustomComponentCallbacks(this._surveyModel);
			this._surveyModel.onValueChanged.add(this._onQuestionValueChanged.bind(this));
			this._surveyModel.onCurrentPageChanging.add(this._onCurrentPageChanging.bind(this));
			this._surveyModel.onComplete.add(this._onSurveyComplete.bind(this));
			this._surveyModel.onTextMarkdown.add(this._onTextMarkdown.bind(this));
			this._surveyModel.isInitialized = true;
			this._surveyModel.onAfterRenderQuestion.add(this._handleAfterQuestionRender.bind(this));
		}

		const completeText = surveyIdx < this._surveyData.surveys.length - 1 ? (this._surveyModel.pageNextText || CAPTIONS.NEXT) : undefined;
		jQuery(".survey").Survey({
			model: this._surveyModel,
			showItemsInOrder: "column",
			completeText,
			...surveyData.surveySettings,
		});

		this._questionAnswerTimestampClock.reset();

		// TODO: should this be conditional?
		this._surveyModel.startTimer();

		this._surveyRunningPromise = new Promise((res, rej) => {
			this._surveyRunningPromiseResolve = res;
			this._surveyRunningPromiseReject = rej;
		});

		return this._surveyRunningPromise;
	}

	async _runSurveyFlow (surveyBlock, surveyData, prevBlockResults = {})
	{
		// let surveyBlock;
		let surveyIdx;
		let surveyCompletionCode;
		let i, j;

		if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL)
		{
			const dataset = Object.assign({}, this._totalSurveyResults, this._variables);
			this._expressionsRunner.expressionExecutor.setExpression(surveyBlock.condition);
			if (this._expressionsRunner.run(dataset))
			{
				await this._runSurveyFlow(surveyBlock.nodes[0], surveyData, prevBlockResults);
			}
			else if (surveyBlock.nodes[1] !== undefined)
			{
				await this._runSurveyFlow(surveyBlock.nodes[1], surveyData, prevBlockResults);
			}
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.RANDOMIZER)
		{
			this._InPlaceFisherYatesShuffle(surveyBlock.nodes, 0, surveyBlock.nodes.length - 1);
			// await this._runSurveyFlow(surveyBlock, surveyData, prevBlockResults);
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.EMBEDDED_DATA)
		{
			let t = performance.now();
			const surveyBlockData = surveyData.embeddedData[surveyBlock.dataIdx];
			for (j = 0; j < surveyBlockData.length; j++)
			{
				// TODO: handle the rest data types.
				if (surveyBlockData[j].type === "Custom")
				{
					// Variable value can be an expression. Check if so and if valid - run it.
					// surveyBlockData is an array so all the variables in it are in order they were declared in Qualtrics.
					// This means this._variables is saturated gradually with the data necessary to perform a computation.
					// It's guaranteed to be there, unless there are declaration order mistakes.
					this._expressionsRunner.expressionExecutor.setExpression(surveyBlockData[j].value);
					if (this._expressionsRunner.expressionExecutor.canRun())
					{
						this._variables[surveyBlockData[j].key] = this._expressionsRunner.run(this._variables);
					}
					else
					{
						this._variables[surveyBlockData[j].key] = surveyBlockData[j].value;
					}
				}
			}
			console.log("embedded data variables accumulation took", performance.now() - t);
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.ENDSURVEY)
		{
			if (this._surveyModel)
			{
				this._surveyModel.setCompleted();
			}
			console.log("EndSurvey block encountered, exiting.");
			return;
		}
		else if (surveyBlock.type === Survey.SURVEY_FLOW_PLAYBACK_TYPES.DIRECT)
		{
			surveyCompletionCode = await this._beginSurvey(surveyData, surveyBlock);
			Object.assign({}, prevBlockResults, this._surveyModel.data);

			// SkipLogic had destination set to ENDOFSURVEY.
			if (surveyCompletionCode === SURVEY_COMPLETION_CODES.SKIP_TO_END_OF_SURVEY)
			{
				return;
			}
		}

		if (surveyBlock.nodes instanceof Array && surveyBlock.type !== Survey.SURVEY_FLOW_PLAYBACK_TYPES.CONDITIONAL)
		{
			for (i = 0; i < surveyBlock.nodes.length; i++)
			{
				await this._runSurveyFlow(surveyBlock.nodes[i], surveyData, prevBlockResults);
			}
		}
	}

	_resetState ()
	{
		this._lastPageSwitchHandledIdx = -1;
	}

	_handleSignaturePadResize (entries)
	{
		let signatureCanvas;
		let q;
		let i;
		for (i = 0; i < entries.length; i++)
		{
			signatureCanvas = entries[i].target.querySelector("canvas");
			q = this._surveyModel.getQuestionByName(entries[i].target.dataset.name);
			q.signatureWidth = Math.min(q.maxSignatureWidth, entries[i].contentBoxSize[0].inlineSize);
		}
	}

	_addEventListeners ()
	{
		this._signaturePadRO = new ResizeObserver(this._handleSignaturePadResize.bind(this));
	}

	_handleAfterQuestionRender (sender, options)
	{
		if (options.question.getType() === "signaturepad")
		{
			this._signaturePadRO.observe(options.htmlElement);
		}
	}

	_detachResizeObservers ()
	{
		this._signaturePadRO.disconnect();
	}

	/**
	 * Init the SurveyJS.io library.
	 *
	 * @protected
	 */
	_initSurveyJS()
	{
		// load the Survey.js libraries, if necessary:
		// TODO

		this._addEventListeners();
		// load the PsychoJS SurveyJS extensions:
		this._expressionsRunner = new window.Survey.ExpressionRunner();
		this._registerCustomExpressionFunctions(window.Survey, customExpressionFunctionsArray);
		this._registerWidgets(window.Survey);
		this._registerCustomSurveyProperties(window.Survey);

		// setup the survey theme:
		window.Survey.Serializer.getProperty("expression", "minWidth").defaultValue = "100px";
		window.Survey.settings.minWidth = "100px";
		window.Survey.StylesManager.applyTheme("defaultV2");

		// load the desired style:
		// TODO
		// util.loadCss("./survey/css/grey_style.css");
	}
}
