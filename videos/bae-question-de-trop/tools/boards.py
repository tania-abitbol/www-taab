"""Storyboards des trois vidéos (une phrase de narration = un plan)."""
MYLENE, SOLENE = 'WQKwBV2Uzw1gSGr69N8I', 'KSyQzmsYhFbuOhqj1Xxv'  # 2e voix : Lea - UGC creator
def P(h, arms='rest', **k): return dict(h=h, arms=arms, **k)
RED = [225, 40, 50]; GOLD = [255, 226, 140]

BOARDS = {
 'test': dict(title='Le test', voice=MYLENE, tag='[playful, confident, fast-paced]', music='bgm-sneaky-snitch', music_from=0.0, speed=1.2, model='eleven_multilingual_v2', beats=[
   dict(say='Pose cette question à ton mec.', cam='wide', label=['POSE CETTE QUESTION', 'À TON MEC'], card='card1', elle=P('smug'), lui=P('soft'), sfx=['pop'], shake=6),
   dict(say='Qui de nous deux ment le mieux ?', cam='card', card='card1', elle=P('smug'), lui=P('soft'), sfx=['swish']),
   dict(say='S\'il répond « toi » direct…', cam='two', label=['« TOI »'], card='card1', bolt=1, flash=RED, elle=P('shock', hop=1), lui=P(['smug', 'tender'], 'point'), sfx=['zap', 'hit'], shake=9),
   dict(say='c\'est un homme courageux.', cam='elle', elle=P('angry', 'fold', tilt=-4), lui=P('smug', 'point'), sfx=['swish']),
   dict(say='S\'il répond « moi »…', cam='two', label=['« MOI »'], card='card1', elle=P('soft'), lui=P(['smug', 'tender'], 'up'), sfx=['pop']),
   dict(say='il vient d\'avouer.', cam='elle', elle=P('smug', 'point', tilt=5), lui=P('smug', 'up'), sfx=['swish']),
   dict(say='Et s\'il dit « aucun des deux »…', cam='two', label=['« AUCUN', 'DES DEUX »'], card='card1', elle=P('sulk'), lui=P(['tender', 'smug'], 'shrug'), sfx=['pop']),
   dict(say='c\'est lui. C\'est lui qui ment le mieux.', cam='two', card='card1', bolt=1, flash=RED, elle=P(['shout', 'angry'], 'jab', yell=1), lui=P('soft', hop=1), sfx=['zap', 'hit'], shake=9),
   dict(say='Le mien a répondu quoi, d\'après vous ?', cam='wide', label=['LE MIEN A', 'RÉPONDU QUOI ?'], gap=1, gap_from=0, elle=P('sulk', 'fold', away=1), lui=P('sulk', 'fold', away=1), sfx=['hit', 'stones'], shake=11),
 ]),
 'histoire': dict(title='L\'histoire', voice=SOLENE, tag='[energetic storyteller, fast-paced]', music='bgm-monkeys-spinning-monkeys', music_from=7.4, speed=1.2, model='eleven_multilingual_v2', beats=[
   dict(say='Ce couple a failli rompre à cause d\'une seule carte.', cam='wide', label=['ILS ONT FAILLI ROMPRE', 'À CAUSE D\'UNE CARTE'], bolt=1, flash=RED, elle=P(['shout', 'angry'], 'point', yell=1), lui=P(['shout2', 'shout'], 'point', yell=1), sfx=['zap', 'hit'], shake=9),
   dict(say='Samedi soir, petit jeu de questions. Tranquille.', cam='two', elle=P('smug'), lui=P('tender'), sfx=['swish']),
   dict(say='Première carte : qui de vous deux ment le mieux ?', cam='card', card='card1', elle=P('soft'), lui=P('soft'), sfx=['pop']),
   dict(say='Ils se sont pointés du doigt. En même temps.', cam='two', card='card1', bolt=1, flash=RED, elle=P('shout', 'point', hop=1), lui=P('shout2', 'point', hop=1), sfx=['zap', 'hit'], shake=9),
   dict(say='Elle a ressorti le cadeau « perdu par la poste ».', cam='elle', gap=1, gap_from=0, bubble_e=1, elle=P(['shout', 'angry'], 'jab', yell=1), lui=P('shout2'), sfx=['hit', 'pop'], shake=10),
   dict(say='Lui, les « j\'arrive dans cinq minutes ».', cam='lui', gap=1, bubble_e=1, bubble_l=1, elle=P('angry'), lui=P(['shout', 'shout2'], 'jab', yell=1), sfx=['swish', 'pop'], shake=6),
   dict(say='Résultat : chacun son bout de canapé.', cam='wide', gap=1, elle=P('sulk', 'fold', away=1), lui=P('sulk', 'fold', away=1), sfx=['scratch'], music_stop=1),
   dict(say='Carte suivante : ce que tu préfères chez l\'autre ?', cam='card', gap=1, card='card2', buzz=1, elle=P('soft', away=1), lui=P('soft', away=1), sfx=['buzz', 'pop']),
   dict(say='Il a dit : « ton rire ».', cam='lui', gap=1, elle=P('soft', away=1), lui=P('tender', tilt=4), sfx=['glass']),
   dict(say='Elle a ri. Fin de la guerre.', cam='wide', cuddle=1, heart=1, confetti=1, flash=GOLD, phone='floor', elle=P('laugh'), lui=P('tender'), sfx=['glass2', 'coins', 'pop'], shake=9, music2=1),
   dict(say='Enfin… jusqu\'à la carte d\'après.', cam='wide', cuddle=1, card='card3', phone='floor', label=['À SUIVRE…'], label_y=1130, elle=P('soft'), lui=P('soft'), sfx=['pop']),
 ]),
 'types': dict(title='3 types de mecs', voice=MYLENE, tag='[playful, sarcastic, fast-paced]', music='bgm-fluffing-a-duck', music_from=0.0, speed=1.2, model='eleven_multilingual_v2', beats=[
   dict(say='Trois types de mecs quand tu lui demandes :', cam='wide', label=['3 TYPES DE MECS', 'FACE À CETTE QUESTION'], card='card1', elle=P('smug'), lui=P('soft'), sfx=['pop'], shake=6),
   dict(say='qui de nous deux ment le mieux ?', cam='card', card='card1', elle=P('smug'), lui=P('soft'), sfx=['swish']),
   dict(say='Un : le politicien.', cam='two', label=['1. LE POLITICIEN'], elle=P('sulk'), lui=P('smug', 'up', hop=1), sfx=['hit']),
   dict(say='« Ça dépend de ce qu\'on appelle mentir. »', cam='two', label=['1. LE POLITICIEN'], elle=P('angry', 'fold'), lui=P(['smug', 'tender'], 'shrug'), sfx=[]),
   dict(say='Deux : le fuyard.', cam='two', label=['2. LE FUYARD'], elle=P('shock'), lui=P('soft', away=1, hop=1), sfx=['hit']),
   dict(say='« Attends, j\'ai pas un truc au four ? »', cam='wide', label=['2. LE FUYARD'], gap=1, gap_from=0, elle=P('angry', 'point'), lui=P(['soft', 'sulk'], away=1), sfx=['swish', 'stones']),
   dict(say='Trois : le kamikaze.', cam='two', label=['3. LE KAMIKAZE'], elle=P('soft'), lui=P('smug', 'point', hop=1), sfx=['hit']),
   dict(say='« Toi. Évidemment. »', cam='two', label=['3. LE KAMIKAZE'], bolt=1, flash=RED, elle=P('shock', hop=1), lui=P(['smug', 'tender'], 'jab'), sfx=['zap'], shake=9),
   dict(say='Le kamikaze dort sur le canapé.', cam='wide', gap=1, elle=P('sulk', 'fold', away=1), lui=P('sulk'), sfx=['scratch', 'hit'], shake=8),
   dict(say='Mais au moins, il a pas menti.', cam='lui', gap=1, elle=P('sulk', 'fold', away=1), lui=P('tender', tilt=4), sfx=['glass']),
   dict(say='Le tien, c\'est lequel ?', cam='wide', label=['LE TIEN,', 'C\'EST LEQUEL ?'], gap=1, elle=P('smug'), lui=P('sulk'), sfx=['pop'], shake=6),
 ]),
}
