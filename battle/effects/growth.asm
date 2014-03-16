_GrowthCommand:
; growth

	ld bc, PlayerStatLevels
	ld a, [hBattleTurn]
	and a
	jr z, .growth
	ld de, EnemyMonType1
	ld bc, EnemyStatLevels
.growth

; If no stats can be increased, don't.

; Attack
	ld a, [bc]
	cp 13 ; max
	jr c, .can

; Special Attack
	inc bc
	inc bc
	inc bc
	ld a, [bc]
	cp 13 ; max
	jr nc, .cantraisestats

.can
	ld a, 1
	ld [$c689], a
	callba AnimateCurrentMove
	ld a, 2
	callba Function36532

; Check if sunny for sharp increases

	ld a, [Weather]
	cp WEATHER_SUN
	jr z, .double

	callba BattleCommand70
	callba BattleCommand8c
	callba ResetMiss
	callba BattleCommand73
	callba BattleCommand8c
	ret

.double
; Raises Attack and Special Attack sharply if sunny
	callba BattleCommand77
	callba BattleCommand8c
	callba ResetMiss
	callba BattleCommand7a
	callba BattleCommand8c
	ret

.cantraisestats
; Can't raise either stat.
	ld b, 8 ; ABILITY
	callba GetStatName
	callba AnimateFailedMove
	ld hl, WontRiseAnymoreText
	callba StdBattleTextBox
	ret

