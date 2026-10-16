-- ============================================================
-- Ministry Leaders (18) — names, titles and bios for the Team section.
-- Run once in the Supabase SQL Editor. Safe to re-run: people already in
-- team_members (same name) are left alone. Photos are added in Admin → Team.
-- ============================================================

-- The "Ministry Leaders" section (skipped if sections aren't set up).
do $$ begin
  insert into team_sections (name, sort_order) values ('Ministry Leaders', 3) on conflict (name) do nothing;
exception when undefined_table then null; end $$;

insert into team_members (name, role_title, grouping, bio, sort_order, published)
select v.name, v.role_title, 'Ministry Leaders', nullif(v.bio, ''),
       (select coalesce(max(sort_order), 0) from team_members) + v.n, true
from (values
(1, 'Melisa Vaccaro', 'Worship Leader', $b$Melisa has devoted much of her life to serving in the church's worship ministry in many roles, including flutist, keyboardist, vocalist, choir director and musical drama director.

She is passionate about fostering creativity and collaboration among the servant leaders who make up the worship team. In her desire to keep growing and serving effectively, she recently earned a Master of Arts in Worship Leadership from North Central University.

Melisa serves as the Worship Leader at Oasis, where she is committed to creating an atmosphere that leads people into the presence of God. Her heart for worship is reflected not only in her leadership but also in her encouragement and care for those she serves alongside.

She considers it a privilege to help guide the church in meaningful and authentic worship each week.$b$),
(2, 'Jimmy Trowbridge', 'The Journey', $b$Jimmy started attending Oasis Christian Centre in 2001. During his time at Oasis, he has gone from an observer to a passionate leader. He began serving by filling in as an usher, and as he grew in his walk with Christ, he dedicated his life to the Lord — and with that came a strong desire to do more. Jimmy served as our head usher for a number of years, and today he is an integral part of our men's ministry, FMO.

Jimmy's greatest passion is seeing those who struggle with the darkness of addiction find the light of Christ, just as Christ delivered him over 34 years ago. He leads The Journey, a ministry for anyone dealing with something that is separating them from God.

Jimmy has been married for 37 years to his beautiful wife, Lori, and together they have two beautiful daughters, Ashlei and Hailei.$b$),
(3, 'Susan Clement', 'Office Administrator', ''),
(4, 'John Higgins', 'Parking', $b$John has been attending Oasis for 10 years. He leads our parking team, which we consider the "first impression" at Oasis. Rain or shine, in high temperatures or extreme cold, John and his team help direct you and your family to a parking spot with a smile.

In John's words: "I love leading our parking team because I love helping people get in and out of church safely and making a good first impression before they go inside. My passion is to make people feel comfortable being here."

John has two beautiful children and loves jogging and going to baseball games.$b$),
(5, 'Albert & Ruth Perez', 'Youth Leaders', ''),
(6, 'Mary Collins', 'Guest Experience', $b$Mary started attending Oasis in 2004. For over a decade, she has served in many areas of ministry, including seven years in Kids Church and ten years in our SLAM department. In 2015, Mary took the lead of a new department, the Guest Experience Team, and since then she has helped transform the way we minister to our Oasis family and guests.

She has a passion for people and top-notch organizational skills. Mary and her husband, Steve, have four children and nine grandchildren — soon to be ten! Mary enjoys baking, organizing parties and spending time with her grandchildren.$b$),
(7, 'Wilfred Llewellyn', 'Campus / Security', $b$Wilfred first came to Oasis with his wife, Althea, in 1994. Within two years he was plugged into ministry, and he has served ever since. Wilfred is known as the "iron man" of Oasis for his ability to cover many areas at once: he has been involved in the parking team, ushering, building maintenance, project management and much more. Today he oversees our campus and security.

Wilfred is a dedicated, hard worker who has invested countless hours in caring for our church. Throughout his years at Oasis, he has never been afraid to get his hands dirty to do what needs to be done — even the undesirable tasks.

Wilfred and Althea have one child, who grew up through the various ministries at the church. In his free time, Wilfred loves reading and home improvement.$b$),
(8, 'Yasmyn Callender', 'Nursery', $b$Yasmyn, along with her husband, Andre, and their four children, Damien, Paulo, Isabella and Adrianna, began attending Oasis in 2015. Shortly afterward, she began serving in the Nursery Ministry under the exceptional leadership of Althea Llewellyn.

With many years of classroom experience, Yasmyn quickly recognized the tremendous impact the Oasis Nursery Ministry has, not only on the children it serves but also on their families. The nursery team's work is especially meaningful to her because it gives parents the opportunity to fully receive the Word of God, with peace of mind that their children are being lovingly cared for and taught the Word in a way that is engaging and enjoyable.

Yasmyn firmly believes in the promise of Proverbs 22:6: "Train up a child in the way he should go: and when he is old, he will not depart from it."

She does not take this responsibility lightly and considers it a true honor to help nurture and raise the next generation of Oasis leaders.$b$),
(9, 'Erica Scala', 'Women''s Ministry', $b$Erica and her husband, Pastor Paul, both graduated from Rhema Bible College in Tulsa, Oklahoma. She served faithfully for many years on the worship team and in WOW under her mother, Loni Arce, who eventually passed the torch to Erica as our full-time women's leader.

Erica has a heart for leading the lost to Christ and teaching God's Word. She is a true example of a servant of God.$b$),
(10, 'Brian "Red" MacMillan', 'Stage and Sound', $b$Brian "Red" MacMillan (don't call him Brian) and his wife, Cherice, first came to Oasis Christian Centre in 2014 and made Oasis their home church after the birth of their daughter, Jade, in 2016. In 2019, Red and Cherice both felt the call to serve — Cherice in Kids Church and Red on the Sound Team. Red also serves as Technical Director and Stage Manager for our UCPAC services at Easter and Christmas, and he was appointed Sound Team Leader in 2023.

Red accepted the Lord at age 7 and was baptized at age 9. His service follows in the footsteps of his parents, who both served in several ministries, and his grandfather, who was an elder (pastor) at the church Red grew up in. Red has a background in music and played trumpet from fourth grade through college. In high school he found a passion for audio engineering, and in college he started a live sound company focused on small music venues and community theater.

Red has worked in the heating business, specializing in boilers, since 2007. In his free time he enjoys lawn care and fixing things, but his favorite thing to do is spend time with his family.$b$),
(11, 'Nicky Smith', 'Social Media Lead', $b$Nicky has been part of the Oasis family for over ten years. After giving his life to Christ and being baptized, he committed himself to serving wherever needed, from ushering to leading in The Journey and supporting many areas of ministry.

Nicky leads the social media ministry, using his business experience and creativity to share the message of Jesus and build connection within the church. He has been in recovery for over 12 years, and his life reflects God's grace, redemption and faithfulness.

At the center of everything is his family — his wife, Ashlei, and their daughter, Addison — who serve alongside him and are his greatest blessing, constantly reminding him of God's goodness and purpose.$b$),
(12, 'Karen Entenza', 'Media Presentation', $b$Karen and her husband, Juan, have been at Oasis since 2006. She has learned that God doesn't ask whether you are able to do His calling, but whether you are willing — and He will help you.

Karen has served in many ministries at Oasis. She enjoys actively supporting the church's mission of helping people know God, and she leads the Media Presentation team.$b$),
(13, 'George Matos', 'Creative Media', $b$George and his wife, Eleana, along with their children, Josiah and Geana, have been part of Oasis since 2022. After moving to New Jersey from the Bronx in 2021, they would often drive past Oasis on Sunday mornings while picking up bagels on their way to church in New York. Curious about the church, George began watching services online, which led the family to visit in person later that year.

Having served in other churches before, George and Eleana planned to take a break from serving. But God had other plans, gently leading them back into serving and deeper into the Oasis community.$b$),
(14, 'Brian Wilson', 'Broadcast', $b$Brian and his wife, Lisa, have been attending Oasis since 2004, when he began serving on the sound board. A few years later, Brian moved to the video production team, and in 2025 he was selected as the video production team leader. Lisa serves in the Oasis nursery.

Brian is a retired police sergeant who loves DJing, roller skating, biking and taking walks.$b$),
(15, 'Angel & Ada Cardona', 'Outreach Leaders', ''),
(16, 'Froebel Morisseau', 'Planning Center Administrator', ''),
(17, 'Candi Young', 'Serve Central', ''),
(18, 'Jaime Cruz', 'Ushers Leader', '')
) as v(n, name, role_title, bio)
where not exists (select 1 from team_members t where lower(t.name) = lower(v.name));

-- Check: should list 18 people in the Ministry Leaders section.
-- select name, role_title from team_members where grouping = 'Ministry Leaders' order by sort_order;
