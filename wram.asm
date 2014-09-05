INCLUDE "includes.asm"

flag_array: MACRO
	ds ((\1) + 7) / 8
ENDM

box_struct_length EQU 32
box_struct: MACRO
\1Species::        db
\1Item::           db
\1Moves::          ds NUM_MOVES
\1ID::             dw
\1Exp::            ds 3
\1StatExp::
\1HPExp::          dw
\1AtkExp::         dw
\1DefExp::         dw
\1SpdExp::         dw
\1SpcExp::         dw
\1DVs::            ds 2
\1PP::             ds NUM_MOVES
\1Happiness::      db
\1PokerusStatus::  db
\1CaughtData::
\1CaughtTime::
\1CaughtLevel::    db
\1CaughtGender::
\1CaughtLocation:: db
\1Level::          db
\1End::
ENDM

party_struct: MACRO
	box_struct \1
\1Status::         db
\1Unused::         db
\1HP::             dw
\1MaxHP::          dw
\1Stats:: ; big endian
\1Attack::         dw
\1Defense::        dw
\1Speed::          dw
\1SpclAtk::        dw
\1SpclDef::        dw
\1StatsEnd::
ENDM

battle_struct: MACRO
\1Species::   db
\1Item::      db
\1Moves::     ds NUM_MOVES
\1MovesEnd::
\1DVs::       ds 2
\1PP::        ds NUM_MOVES
\1Happiness:: db
\1Level::     db
\1Status::    ds 2
\1HP::        dw
\1MaxHP::     dw
\1Stats:: ; big endian
\1Attack::    dw
\1Defense::   dw
\1Speed::     dw
\1SpclAtk::   dw
\1SpclDef::   dw
\1StatsEnd::
\1Type::
\1Type1::     db
\1Type2::     db
ENDM


channel_struct: MACRO
; Addreses are Channel1 (c101).
\1MusicID::           dw
\1MusicBank::         db
\1Flags::             db ; 0:on/off 1:subroutine 4:noise
\1Flags2::            db ; 0:vibrato on/off 2:duty
\1Flags3::            db ; 0:vibrato up/down
\1MusicAddress::      dw
\1LastMusicAddress::  dw
                      dw
\1NoteFlags::         db ; 5:rest
\1Condition::         db ; conditional jumps
\1DutyCycle::         db ; bits 6-7 (0:12.5% 1:25% 2:50% 3:75%)
\1Intensity::         db ; hi:pressure lo:velocity
\1Frequency:: ; 11 bits
\1FrequencyLo::       db
\1FrequencyHi::       db
\1Pitch::             db ; 0:rest 1-c:note
\1Octave::            db ; 7-0 (0 is highest)
\1StartingOctave::    db ; raises existing octaves (to repeat phrases)
\1NoteDuration::      db ; frames remaining for the current note
                      ds 1 ; c117
                      ds 1 ; c118
\1LoopCount::         db
\1Tempo::             dw
\1Tracks::            db ; hi:left lo:right
                      ds 1 ; c11d
\1VibratoDelayCount:: db ; initialized by \1VibratoDelay
\1VibratoDelay::      db ; number of frames a note plays until vibrato starts
\1VibratoExtent::     db
\1VibratoRate::       db ; hi:frames for each alt lo:frames to the next alt
                      ds 1 ; c122
                      ds 1 ; c123
                      ds 1 ; c124
                      ds 1 ; c125
                      ds 1 ; c126
                      ds 1 ; c127
\1CryPitch::          dw
                      ds 4
\1NoteLength::        db ; frames per 16th note
                      ds 1 ; c12f
                      ds 1 ; c130
                      ds 1 ; c131
                      ds 1 ; c132
ENDM

SECTION "tiles0",VRAM[$8000],BANK[0]
VTiles0::
SECTION "tiles1",VRAM[$8800],BANK[0]
VTiles1::
SECTION "tiles2",VRAM[$9000],BANK[0]
VTiles2::
SECTION "bgmap0",VRAM[$9800],BANK[0]
VBGMap0::
SECTION "bgmap1",VRAM[$9C00],BANK[0]
VBGMap1::



SECTION "WRAMBank0",WRAM0[$c000]

SECTION "stack",WRAM0[$c0ff]
Stack:: ds -$100 ; c0ff


SECTION "audio",WRAM0[$c100]
MusicPlaying:: ; c100
; nonzero if playing
	ds 1

Channels::
Channel1:: channel_struct Channel1 ; c101
Channel2:: channel_struct Channel2 ; c133
Channel3:: channel_struct Channel3 ; c165
Channel4:: channel_struct Channel4 ; c197

SFXChannels::
Channel5:: channel_struct Channel5 ; c1c9
Channel6:: channel_struct Channel6 ; c1fb
Channel7:: channel_struct Channel7 ; c22d
Channel8:: channel_struct Channel8 ; c25f

	ds 1 ; c291
	ds 1 ; c292
	ds 1 ; c293
	ds 1 ; c294
	ds 1 ; c295
	ds 1 ; c296
	ds 1 ; c297

CurMusicByte:: ; c298
	ds 1
CurChannel:: ; c299
	ds 1
Volume:: ; c29a
; corresponds to $ff24
; Channel control / ON-OFF / Volume (R/W)
;   bit 7 - Vin->SO2 ON/OFF
;   bit 6-4 - SO2 output level (volume) (# 0-7)
;   bit 3 - Vin->SO1 ON/OFF
;   bit 2-0 - SO1 output level (volume) (# 0-7)
	ds 1
SoundOutput:: ; c29b
; corresponds to $ff25
; bit 4-7: ch1-4 so2 on/off
; bit 0-3: ch1-4 so1 on/off
	ds 1
SoundInput:: ; c29c
; corresponds to $ff26
; bit 7: global on/off
; bit 0: ch1 on/off
; bit 1: ch2 on/off
; bit 2: ch3 on/off
; bit 3: ch4 on/off
	ds 1

MusicID::
MusicIDLo:: ; c29d
	ds 1
MusicIDHi:: ; c29e
	ds 1
MusicBank:: ; c29f
	ds 1
NoiseSampleAddress::
NoiseSampleAddressLo:: ; c2a0
	ds 1
NoiseSampleAddressHi:: ; c2a1
	ds 1
; noise delay? ; c2a2
	ds 1
; c2a3
	ds 1
MusicNoiseSampleSet:: ; c2a4
	ds 1
SFXNoiseSampleSet:: ; c2a5
	ds 1
Danger:: ; c2a6
; bit 7: on/off
; bit 4: pitch
; bit 0-3: counter
	ds 1
MusicFade:: ; c2a7
; fades volume over x frames
; bit 7: fade in/out
; bit 0-5: number of frames for each volume level
; $00 = none (default)
	ds 1
MusicFadeCount:: ; c2a8
	ds 1
MusicFadeID::
MusicFadeIDLo:: ; c2a9
	ds 1
MusicFadeIDHi:: ; c2aa
	ds 1
	ds 5
CryPitch:: ; c2b0
	ds 2
CryLength:: ; c2b2
	ds 2
LastVolume:: ; c2b4
	ds 1
	ds 1
SFXPriority:: ; c2b6
; if nonzero, turn off music when playing sfx
	ds 1
	ds 6
CryTracks:: ; c2bd
; plays only in left or right track depending on what side the monster is on
; both tracks active outside of battle
	ds 1
	ds 1
CurSFX:: ; c2bf
; id of sfx currently playing
	ds 1
wMapMusic:: ; c2c0
	ds 1

	ds 1

wLZAddress:: dw ; c2c2
wLZBank::    db ; c2c4

	ds 2

InputType:: ; c2c7
	ds 1
AutoInputAddress:: ; c2c8
	ds 2
AutoInputBank:: ; c2ca
	ds 1
AutoInputLength:: ; c2cb
	ds 1

	ds 16

InLinkBattle:: ; c2dc
; 0 not in link battle
; 1 link battle
; 4 mobile battle
	ds 1

ScriptVar:: ; c2dd
	ds 1


SECTION "tiles",WRAM0[$c2fa]
TileDown:: ; c2fa
	ds 1
TileUp:: ; c2fb
	ds 1
TileLeft:: ; c2fc
	ds 1
TileRight:: ; c2fd
	ds 1

TilePermissions:: ; c2fe
; set if tile behavior prevents
; you from walking in that direction
; bit 3: down
; bit 2: up
; bit 1: left
; bit 0: right
	ds 1

SECTION "icons",WRAM0[$c3b6]

CurIcon:: ; c3b6
	ds 1

SECTION "gfx",WRAM0[$c400]

Sprites:: ; c400
; 4 bytes per sprite
; 40 sprites
; struct:
;	y in pixels
;	x in pixels
;	tile id
;	attributes:
;		bit 7: priority
;		bit 6: y flip
;		bit 5: x flip
;		bit 4: pal # (non-cgb)
;		bit 3: vram bank (cgb only)
;		bit 2-0: pal # (cgb only)
	ds 4 * 40
SpritesEnd::

TileMap:: ; c4a0
; 20x18 grid of 8x8 tiles
	ds SCREEN_WIDTH * SCREEN_HEIGHT
TileMapEnd::


wBattle::

wEnemyMoveStruct::  ds MOVE_LENGTH ; c608
wPlayerMoveStruct:: ds MOVE_LENGTH ; c60f

EnemyMonNick::  ds PKMN_NAME_LENGTH ; c616
BattleMonNick:: ds PKMN_NAME_LENGTH ; c621

BattleMon:: battle_struct BattleMon ; c62c
	ds 10

OTName:: ; c656
	ds NAME_LENGTH

	ds 2

CurOTMon:: ; c663
	ds 1
	
	ds 1

TypeModifier:: ; c665
; >10: super-effective
;  10: normal
; <10: not very effective
; bit 7: stab
	ds 1

CriticalHit:: ; c666
; nonzero for a critical hit
	ds 1
	
AttackMissed:: ; c667
; nonzero for a miss
	ds 1
	
PlayerSubStatus1:: ; c668
; bit
; 7 attract
; 6 encore
; 5 endure
; 4 perish song
; 3 identified
; 2 protect
; 1 curse
; 0 nightmare
	ds 1
PlayerSubStatus2:: ; c669
; bit
; 7
; 6
; 5
; 4
; 3
; 2
; 1
; 0 curled
	ds 1
PlayerSubStatus3:: ; c66a
; bit
; 7 confused
; 6 flying
; 5 underground
; 4 charged
; 3 flinch
; 2
; 1 rollout
; 0 bide
	ds 1
PlayerSubStatus4:: ; c66b
; bit
; 7 leech seed
; 6 rage
; 5 recharge
; 4 substitute
; 3
; 2 focus energy
; 1 mist
; 0 bide: unleashed energy
	ds 1
PlayerSubStatus5:: ; c66c
; bit
; 7 cant run
; 6 destiny bond
; 5 lock-on
; 4
; 3
; 2
; 1
; 0 toxic
	ds 1

EnemySubStatus1:: ; c66d
; see PlayerSubStatus1
	ds 1
EnemySubStatus2:: ; c66e
; see PlayerSubStatus2
	ds 1
EnemySubStatus3:: ; c66f
; see PlayerSubStatus3
	ds 1
EnemySubStatus4:: ; c670
; see PlayerSubStatus4
	ds 1
EnemySubStatus5:: ; c671
; see PlayerSubStatus5
	ds 1

PlayerRolloutCount:: ; c672
	ds 1
PlayerConfuseCount:: ; c673
	ds 1
PlayerToxicCount:: ; c674
	ds 1
PlayerDisableCount:: ; c675
	ds 1
PlayerEncoreCount:: ; c676
	ds 1
PlayerPerishCount:: ; c677
	ds 1
PlayerFuryCutterCount:: ; c678
	ds 1
PlayerProtectCount:: ; c679
	ds 1

EnemyRolloutCount:: ; c67a
	ds 1
EnemyConfuseCount:: ; c67b
	ds 1
EnemyToxicCount:: ; c67c
	ds 1
EnemyDisableCount:: ; c67d
	ds 1
EnemyEncoreCount:: ; c67e
	ds 1
EnemyPerishCount:: ; c67f
	ds 1
EnemyFuryCutterCount:: ; c680
	ds 1
EnemyProtectCount:: ; c681
	ds 1

PlayerDamageTaken:: ; c682
	ds 2
EnemyDamageTaken:: ; c684
	ds 2

	ds 3
	
	ds 1

BattleScriptBuffer:: ; c68a
	ds 40

BattleScriptBufferLoc:: ; c6b2
	ds 2

	ds 2

PlayerStats:: ; c6b6
	ds 10
	ds 1
EnemyStats:: ; c6c1
	ds 10
	ds 1

PlayerStatLevels:: ; c6cc
; 07 neutral
PlayerAtkLevel:: ; c6cc
	ds 1
PlayerDefLevel:: ; c6cd
	ds 1
PlayerSpdLevel:: ; c6ce
	ds 1
PlayerSAtkLevel:: ; c6cf
	ds 1
PlayerSDefLevel:: ; c6d0
	ds 1
PlayerAccLevel:: ; c6d1
	ds 1
PlayerEvaLevel:: ; c6d2
	ds 1
; c6d3
	ds 1
PlayerStatLevelsEnd::

EnemyStatLevels:: ; c6d4
; 07 neutral
EnemyAtkLevel:: ; c6d4
	ds 1
EnemyDefLevel:: ; c6d5
	ds 1
EnemySpdLevel:: ; c6d6
	ds 1
EnemySAtkLevel:: ; c6d7
	ds 1
EnemySDefLevel:: ; c6d8
	ds 1
EnemyAccLevel:: ; c6d9
	ds 1
EnemyEvaLevel:: ; c6da
	ds 1
; c6db
	ds 1

EnemyTurnsTaken:: ; c6dc
	ds 1
PlayerTurnsTaken:: ; c6dd
	ds 1

	ds 1

PlayerSubstituteHP:: ; c6df
	ds 1
EnemySubstituteHP:: ; c6e0
	ds 1

	ds 2

CurPlayerMove:: ; c6e3
	ds 1
CurEnemyMove:: ; c6e4
	ds 1

LinkBattleRNCount:: ; c6e5
; how far through the prng stream
	ds 1

	ds 3

CurEnemyMoveNum:: ; c6e9
	ds 1

	ds 2

wPayDayMoney:: ds 3 ; c6ec

	ds 5

AlreadyDisobeyed:: ; c6f4
	ds 1

DisabledMove:: ; c6f5
	ds 1
EnemyDisabledMove:: ; c6f6
	ds 1
	ds 1

; exists so you can't counter on switch
LastEnemyCounterMove:: ; c6f8
	ds 1
LastPlayerCounterMove:: ; c6f9
	ds 1

	ds 1

AlreadyFailed:: ; c6fb
	ds 1

	ds 3
	
PlayerScreens:: ; c6ff
; bit
; 4 reflect
; 3 light screen
; 2 safeguard
; 0 spikes
	ds 1

EnemyScreens:: ; c700
; see PlayerScreens
	ds 1

PlayerSafeguardCount:: ; c701
	ds 1
PlayerLightScreenCount:: ; c702
	ds 1
PlayerReflectCount:: ; c703
	ds 1

	ds 1

EnemySafeguardCount:: ; c705
	ds 1
EnemyLightScreenCount:: ; c706
	ds 1
EnemyReflectCount:: ; c707
	ds 1

	ds 2

Weather:: ; c70a
; 00 normal
; 01 rain
; 02 sun
; 03 sandstorm
; 04 rain stopped
; 05 sunliight faded
; 06 sandstorm subsided
	ds 1

WeatherCount:: ; c70b
; # turns remaining
	ds 1

LoweredStat:: ; c70c
	ds 1
EffectFailed:: ; c70d
	ds 1
FailedMessage:: ; c70e
	ds 1

	ds 1

wPlayerIsSwitching:: ds 1 ; c710
wEnemyIsSwitching::  ds 1 ; c711

PlayerUsedMoves:: ; c712
; add a move that has been used once by the player
; added in order of use
	ds 4

	ds 5

LastPlayerMove:: ; c71b
	ds 1
LastEnemyMove:: ; c71c
	ds 1

	ds 23

BattleEnded:: ; c734
	ds 1

	ds 12
wBattleEnd::
; c741

SECTION "overworldmap",WRAM0[$c800]
OverworldMap:: ; c800
	ds 1300
OverworldMapEnd::
	
	ds 12

SECTION "gfx2",WRAM0[$cd20]
CreditsPos::
BGMapBuffer:: ; cd20
	ds 2
CreditsTimer:: ; cd22
	ds 1
	ds 37
	
BGMapPalBuffer:: ; cd48
	ds 40

BGMapBufferPtrs:: ; cd70
; 20 bg map addresses (16x8 tiles)
	ds 40

SGBPredef:: ; cd98
	ds 1
PlayerHPPal:: ; cd99
	ds 1
EnemyHPPal:: ; cd9a
	ds 1
	
	ds 62

AttrMap:: ; cdd9
; 20x18 grid of palettes for 8x8 tiles
; read horizontally from the top row
; bit 3: vram bank
; bit 0-2: palette id
	ds SCREEN_WIDTH * SCREEN_HEIGHT
AttrMapEnd::

	ds 30
	
MonType:: ; cf5f
	ds 1

CurSpecies:: ; cf60
	ds 1

	ds 6

Requested2bpp:: ; cf67
	ds 1
Requested2bppSource:: ; cf68
	ds 2
Requested2bppDest:: ; cf6a
	ds 2

Requested1bpp:: ; cf6c
	ds 1
Requested1bppSource:: ; cf6d
	ds 2
Requested1bppDest:: ; cf6f
	ds 2

	ds 3

MenuSelection:: ; cf74
	ds 1



SECTION "VBlank",WRAM0[$cfb1]
OverworldDelay:: ; cfb1
	ds 1
TextDelayFrames:: ; cfb2
	ds 1
VBlankOccurred:: ; cfb3
	ds 1

PredefID:: ; cfb4
	ds 1
PredefTemp:: ; cfb5
	ds 2
PredefAddress:: ; cfb7
	ds 2

	ds 3

GameTimerPause:: ; cfbc
; bit 0
	ds 1

SECTION "Engine",WRAM0[$cfc2]
FXAnimID::
FXAnimIDLo:: ; cfc2
	ds 1
FXAnimIDHi:: ; cfc3
	ds 1

	ds 2

TileAnimationTimer:: ; cfc6
	ds 1

	ds 5

Options:: ; cfcc
; bit 0-2: number of frames to delay when printing text
;   fast 1; mid 3; slow 5
; bit 3: ?
; bit 4: no text delay
; bit 5: stereo off/on
; bit 6: battle style shift/set
; bit 7: battle scene off/on
	ds 1
	
	ds 1

TextBoxFrame:: ; cfce
; bits 0-2: textbox frame 0-7
	ds 1
	
	ds 1

GBPrinter:: ; cfd0
; bit 0-6: brightness
;   lightest: $00
;   lighter:  $20
;   normal:   $40 (default)
;   darker:   $60
;   darkest:  $7F
	ds 1

Options2:: ; cfd1
; bit 1: menu account off/on
	ds 1

	ds 46
	

SECTION "WRAMBank1",WRAMX[$d000],BANK[1]

	ds 2
	
DefaultFlypoint:: ; d002
	ds 1
; d003
	ds 1
; d004
	ds 1
StartFlypoint:: ; d005
	ds 1
EndFlypoint:: ; d006
	ds 1

MovementBuffer:: ; d007

	ds 55

MenuItemsList::
CurFruitTree::
CurInput::
EngineBuffer1:: ; d03e
	ds 1
CurFruit:: ; d03f
	ds 1

MartPointer:: ; d040
	ds 2

MovementAnimation:: ; d042
	ds 1

WalkingDirection:: ; d043
	ds 1

FacingDirection:: ; d044
	ds 1

WalkingX:: ; d045
	ds 1
WalkingY:: ; d046
	ds 1
WalkingTile:: ; d047
	ds 1

	ds 43

StringBuffer1:: ; d073
	ds 19
StringBuffer2:: ; d086
	ds 19
StringBuffer3:: ; d099
	ds 19
StringBuffer4:: ; d0ac
	ds 19
StringBuffer5:: ; d0bf
	ds 19

	ds 2

CurBattleMon:: ; d0d4
	ds 1
CurMoveNum:: ; d0d5
	ds 1

	ds 23

VramState:: ; d0ed
; bit 0: overworld sprite updating on/off
; bit 6: something to do with text
; bit 7: on when surf initiates
;        flickers when climbing waterfall
	ds 1

	ds 2

CurMart:: ; d0f0
	ds 16
CurMartEnd::

	ds 6

CurItem:: ; d106
	ds 1

	ds 1
	
CurPartySpecies:: ; d108
	ds 1

CurPartyMon:: ; d109
; contains which monster in a party
; is being dealt with at the moment
; 0-5
	ds 1

	ds 4

TempMon::
	party_struct TempMon

	ds 3

PartyMenuActionText:: ; d141
	ds 1
	ds 1

CurPartyLevel:: ; d143
	ds 1


SECTION "UsedSprites",WRAMX[$d154],BANK[1]
UsedSprites:: ; d154
	ds 32

SECTION "map",WRAMX[$d19d],BANK[1]

; both are in blocks (2x2 walkable tiles, 4x4 graphics tiles)
MapHeader:: ; d19d
MapBorderBlock:: ; d19d
	ds 1
MapHeight:: ; d19e
	ds 1
MapWidth:: ; d19f
	ds 1
MapBlockDataBank:: ; d1a0
	ds 1
MapBlockDataPointer:: ; d1a1
	ds 2
MapScriptHeaderBank:: ; d1a3
	ds 1
MapScriptHeaderPointer:: ; d1a4
	ds 2
MapEventHeaderPointer:: ; d1a6
	ds 2
; bit set
MapConnections:: ; d1a8
	ds 1
NorthMapConnection:: ; d1a9
NorthConnectedMapGroup:: ; d1a9
	ds 1
NorthConnectedMapNumber:: ; d1aa
	ds 1
NorthConnectionStripPointer:: ; d1ab
	ds 2
NorthConnectionStripLocation:: ; d1ad
	ds 2
NorthConnectionStripLength:: ; d1af
	ds 1
NorthConnectedMapWidth:: ; d1b0
	ds 1
NorthConnectionStripYOffset:: ; d1b1
	ds 1
NorthConnectionStripXOffset:: ; d1b2
	ds 1
NorthConnectionWindow:: ; d1b3
	ds 2

SouthMapConnection:: ; d1b5
SouthConnectedMapGroup:: ; d1b5
	ds 1
SouthConnectedMapNumber:: ; d1b6
	ds 1
SouthConnectionStripPointer:: ; d1b7
	ds 2
SouthConnectionStripLocation:: ; d1b9
	ds 2
SouthConnectionStripLength:: ; d1bb
	ds 1
SouthConnectedMapWidth:: ; d1bc
	ds 1
SouthConnectionStripYOffset:: ; d1bd
	ds 1
SouthConnectionStripXOffset:: ; d1be
	ds 1
SouthConnectionWindow:: ; d1bf
	ds 2

WestMapConnection:: ; d1c1
WestConnectedMapGroup:: ; d1c1
	ds 1
WestConnectedMapNumber:: ; d1c2
	ds 1
WestConnectionStripPointer:: ; d1c3
	ds 2
WestConnectionStripLocation:: ; d1c5
	ds 2
WestConnectionStripLength:: ; d1c7
	ds 1
WestConnectedMapWidth:: ; d1c8
	ds 1
WestConnectionStripYOffset:: ; d1c9
	ds 1
WestConnectionStripXOffset:: ; d1ca
	ds 1
WestConnectionWindow:: ; d1cb
	ds 2

EastMapConnection:: ; d1cd
EastConnectedMapGroup:: ; d1cd
	ds 1
EastConnectedMapNumber:: ; d1ce
	ds 1
EastConnectionStripPointer:: ; d1cf
	ds 2
EastConnectionStripLocation:: ; d1d1
	ds 2
EastConnectionStripLength:: ; d1d3
	ds 1
EastConnectedMapWidth:: ; d1d4
	ds 1
EastConnectionStripYOffset:: ; d1d5
	ds 1
EastConnectionStripXOffset:: ; d1d6
	ds 1
EastConnectionWindow:: ; d1d7
	ds 2


TilesetHeader::
TilesetBank:: ; d1d9
	ds 1
TilesetAddress:: ; d1da
	ds 2
TilesetBlocksBank:: ; d1dc
	ds 1
TilesetBlocksAddress:: ; d1dd
	ds 2
TilesetCollisionBank:: ; d1df
	ds 1
TilesetCollisionAddress:: ; d1e0
	ds 2
TilesetAnim:: ; d1e2
; bank 3f
	ds 2
; unused ; d1e4
	ds 2
TilesetPalettes:: ; d1e6
; bank 3f
	ds 2

EvolvableFlags:: ; d1e8
	flag_array PARTY_LENGTH

	ds 1

MagikarpLength::
Buffer1:: ; d1ea
	ds 1
MovementType::
Buffer2:: ; d1eb
	ds 1

SECTION "BattleMons2",WRAMX[$d1fa],BANK[1]
LinkBattleRNs:: ; d1fa
	ds 10

TempEnemyMonSpecies::  ds 1 ; d204
TempBattleMonSpecies:: ds 1 ; d205

EnemyMon:: battle_struct EnemyMon ; d206
EnemyMonBaseStats:: ds 5 ; d226
EnemyMonCatchRate:: db ; d22b
EnemyMonBaseExp::   db ; d22c
EnemyMonEnd::


IsInBattle:: ; d22d
; 0: overworld
; 1: wild battle
; 2: trainer battle
	ds 1
	
	ds 1

OtherTrainerClass:: ; d22f
; class (Youngster, Bug Catcher, etc.) of opposing trainer
; 0 if opponent is a wild Pokémon, not a trainer
	ds 1

BattleType:: ; d230
; $00 normal
; $01
; $02
; $03 dude
; $04 fishing
; $05 roaming
; $06
; $07 shiny
; $08 headbutt/rock smash
; $09
; $0a force Item1
; $0b
; $0c suicune
	ds 1

OtherTrainerID:: ; d231
; which trainer of the class that you're fighting
; (Joey, Mikey, Albert, etc.)
	ds 1

	ds 1

TrainerClass:: ; d233
	ds 1

UnownLetter:: ; d234
	ds 1

	ds 1

CurBaseData:: ; d236
BaseDexNo:: ; d236
	ds 1
BaseStats:: ; d237
BaseHP:: ; d237
	ds 1
BaseAttack:: ; d238
	ds 1
BaseDefense:: ; d239
	ds 1
BaseSpeed:: ; d23a
	ds 1
BaseSpecialAttack:: ; d23b
	ds 1
BaseSpecialDefense:: ; d23c
	ds 1
BaseType:: ; d23d
BaseType1:: ; d23d
	ds 1
BaseType2:: ; d23e
	ds 1
BaseCatchRate:: ; d23f
	ds 1
BaseExp:: ; d240
	ds 1
BaseItems:: ; d241
	ds 2
BaseGender:: ; d243
	ds 1
BaseUnknown1:: ; d244
	ds 1
BaseEggSteps:: ; d245
	ds 1
BaseUnknown2:: ; d246
	ds 1
BasePicSize:: ; d247
	ds 1
BasePadding:: ; d248
	ds 4
BaseGrowthRate:: ; d24c
	ds 1
BaseEggGroups:: ; d24d
	ds 1
BaseTMHM:: ; d24e
	ds 8


CurDamage:: ; d256
	ds 2


SECTION "TimeOfDay",WRAMX[$d269],BANK[1]

TimeOfDay:: ; d269
	ds 1


SECTION "OTParty",WRAMX[$d280],BANK[1]

OTPartyCount::   ds 1 ; d280
OTPartySpecies:: ds PARTY_LENGTH ; d281
OTPartyEnd::     ds 1

OTPartyMons::
OTPartyMon1:: party_struct OTPartyMon1 ; d288
OTPartyMon2:: party_struct OTPartyMon2 ; d2b8
OTPartyMon3:: party_struct OTPartyMon3 ; d2e8
OTPartyMon4:: party_struct OTPartyMon4 ; d318
OTPartyMon5:: party_struct OTPartyMon5 ; d348
OTPartyMon6:: party_struct OTPartyMon6 ; d378
OTPartyMonsEnd::

OTPartyMonOT:: ds NAME_LENGTH * PARTY_LENGTH ; d3a8
OTPartyMonNicknames:: ds PKMN_NAME_LENGTH * PARTY_LENGTH ; d3ea

	ds 4

wBattleAction:: ds 1 ; d430

	ds 1

MapStatus:: ; d432
	ds 1
MapEventStatus:: ; d433
	ds 1

ScriptFlags:: ; d434
	ds 1
ScriptFlags2:: ; d435
	ds 1
ScriptFlags3:: ; d436
	ds 1

ScriptMode:: ; d437
	ds 1
ScriptRunning:: ; d438
	ds 1
ScriptBank:: ; d439
	ds 1
ScriptPos:: ; d43a
	ds 2

	ds 17

ScriptDelay:: ; d44d
	ds 1

SECTION "Player",WRAMX[$d472],BANK[1]
PlayerGender:: ; d472
; bit 0:
;	0 male
;	1 female
	ds 1
	ds 8
PlayerID:: ; d47b
	ds 2

PlayerName:: ds NAME_LENGTH ; d47d
MomsName::   ds NAME_LENGTH ; d488
RivalName::  ds NAME_LENGTH ; d493
RedsName::   ds NAME_LENGTH ; d49e
GreensName:: ds NAME_LENGTH ; d4a9

	ds 2

; init time set at newgame
StartDay:: ; d4b6
	ds 1
StartHour:: ; d4b7
	ds 1
StartMinute:: ; d4b8
	ds 1
StartSecond:: ; d4b9
	ds 1

wRTC:: ; d4ba
	ds 8
wDST:: ; d4c2
	ds 1

GameTimeCap:: ; d4c3
	ds 1
GameTimeHours:: ; d4c4
	ds 2
GameTimeMinutes:: ; d4c6
	ds 1
GameTimeSeconds:: ; d4c7
	ds 1
GameTimeFrames:: ; d4c8
	ds 1

	ds 2

CurDay:: ; d4cb
	ds 1

	ds 10


ObjectStructs::

PlayerStruct:: ; d4d6
	ds 2
PlayerSprite:: ; d4d8
	ds 1
	ds 3
PlayerPalette:: ; d4dc
	ds 1
	ds 1
PlayerDirection:: ; d4de
; uses bits 2 and 3 / $0c / %00001100
; %00 down
; %01 up
; %10 left
; $11 right
	ds 1
	ds 2
PlayerAction:: ; d4e1
; 1 standing
; 2 walking
; 4 spinning
; 6 fishing
	ds 1
	ds 1
PlayerFacing:: ; d4e3
	ds 1
StandingTile:: ; d4e4
	ds 1
StandingTile2:: ; d4e5
	ds 1
; relative to the map struct including borders
MapX:: ; d4e6
	ds 1
MapY:: ; d4e7
	ds 1
MapX2:: ; d4e8
	ds 1
MapY2:: ; d4e9
	ds 1
	ds 3
; relative to the bg map, in px
PlayerSpriteX:: ; d4ed
	ds 1
PlayerSpriteY:: ; d4ee
	ds 1
	ds 15

ObjectStruct1:: ; d4fe
	ds 40
ObjectStruct2:: ; d526
	ds 40
ObjectStruct3:: ; d54e
	ds 40
ObjectStruct4:: ; d576
	ds 40
ObjectStruct5:: ; d59e
	ds 40
ObjectStruct6:: ; d5c6
	ds 40
ObjectStruct7:: ; d5ee
	ds 40
ObjectStruct8:: ; d616
	ds 40
ObjectStruct9:: ; d63e
	ds 40
ObjectStruct10:: ; d666
	ds 40
ObjectStruct11:: ; d68e
	ds 40
ObjectStruct12:: ; d6b6
	ds 40
; d6de

SECTION "Objects",WRAMX[$d71e],BANK[1]
MapObjects:: ; d71e
	ds OBJECT_LENGTH * NUM_OBJECTS


SECTION "VariableSprites",WRAMX[$d82e],BANK[1]
VariableSprites:: ; d82e
	ds $10


SECTION "Status",WRAMX[$d841],BANK[1]
TimeOfDayPal:: ; d841
	ds 1
	ds 4
; d846
	ds 1
	ds 1
CurTimeOfDay:: ; d848
	ds 1
	
	ds 3

StatusFlags:: ; d84c
	ds 1
StatusFlags2:: ; d84d
	ds 1

Money:: ; d84e
	ds 3

wMomsMoney:: ; d851
	ds 3
wMomSavingMoney:: ; d854
	ds 1

Coins:: ; d855
	ds 2
	
Badges::
JohtoBadges:: ; d857
	flag_array 8
KantoBadges:: ; d858
	flag_array 8
	
SECTION "Items",WRAMX[$d859],BANK[1]
TMsHMs:: ; d859
	ds 57
TMsHMsEnd::

NumItems:: ; d892
	ds 1
Items:: ; d893
	ds 41
ItemsEnd::

NumKeyItems:: ; d8bc
	ds 1
KeyItems:: ; d8bd
	ds 26
KeyItemsEnd::

NumBalls:: ; d8d7
	ds 1
Balls:: ; d8d8
	ds 25
BallsEnd::

PCItems:: ; d8f1
	ds 101
PCItemsEnd::


SECTION "overworld",WRAMX[$d95b],BANK[1]
WhichRegisteredItem:: ; d95b
	ds 1
RegisteredItem:: ; d95c
	ds 1

PlayerState:: ; d95d
	ds 1

SECTION "scriptram",WRAMX[$d962],BANK[1]
MooMooBerries:: ; d962
	ds 1 ; how many berries fed to MooMoo
UndergroundSwitchPositions:: ; d963
	ds 1 ; which positions the switches are in
FarfetchdPosition:: ; d964
	ds 1 ; which position the ilex farfetch'd is in

SECTION "Map Triggers", WRAMX[$d972], BANK[1]

wPokecenter2FTrigger::                       ds 1 ; d972
wTradeCenterTrigger::                        ds 1 ; d973
wColosseumTrigger::                          ds 1 ; d974
wTimeCapsuleTrigger::                        ds 1 ; d975
wPowerPlantTrigger::                         ds 1 ; d976
wCeruleanGymTrigger::                        ds 1 ; d977
wRoute25Trigger::                            ds 1 ; d978
wTrainerHouseB1FTrigger::                    ds 1 ; d979
wVictoryRoadGateTrigger::                    ds 1 ; d97a
wSaffronTrainStationTrigger::                ds 1 ; d97b
wRoute16GateTrigger::                        ds 1 ; d97c
wRoute1718GateTrigger::                      ds 1 ; d97d
wIndigoPlateauPokecenter1FTrigger::          ds 1 ; d97e
wWillsRoomTrigger::                          ds 1 ; d97f
wKogasRoomTrigger::                          ds 1 ; d980
wBrunosRoomTrigger::                         ds 1 ; d981
wKarensRoomTrigger::                         ds 1 ; d982
wLancesRoomTrigger::                         ds 1 ; d983
wHallOfFameTrigger::                         ds 1 ; d984
wRoute27Trigger::                            ds 1 ; d985
wNewBarkTownTrigger::                        ds 1 ; d986
wElmsLabTrigger::                            ds 1 ; d987
wKrissHouse1FTrigger::                       ds 1 ; d988
wRoute29Trigger::                            ds 1 ; d989
wCherrygroveCityTrigger::                    ds 1 ; d98a
wMrPokemonsHouseTrigger::                    ds 1 ; d98b
wRoute32Trigger::                            ds 1 ; d98c
wRoute35NationalParkGateTrigger::            ds 1 ; d98d
wRoute36Trigger::                            ds 1 ; d98e
wRoute36NationalParkGateTrigger::            ds 1 ; d98f
wAzaleaTownTrigger::                         ds 1 ; d990
wGoldenrodGymTrigger::                       ds 1 ; d991
wGoldenrodMagnetTrainStationTrigger::        ds 1 ; d992
wGoldenrodPokecenter1FTrigger::              ds 1 ; d993
wOlivineCityTrigger::                        ds 1 ; d994
wRoute34Trigger::                            ds 1 ; d995
wRoute34IlexForestGateTrigger::              ds 1 ; d996
wEcruteakHouseTrigger::                      ds 1 ; d997
wWiseTriosRoomTrigger::                      ds 1 ; d998
wEcruteakPokecenter1FTrigger::               ds 1 ; d999
wEcruteakGymTrigger::                        ds 1 ; d99a
wMahoganyTownTrigger::                       ds 1 ; d99b
wRoute42Trigger::                            ds 1 ; d99c
wCianwoodCityTrigger::                       ds 1 ; d99d
wBattleTower1FTrigger::                      ds 1 ; d99e
wBattleTowerBattleRoomTrigger::              ds 1 ; d99f
wBattleTowerElevatorTrigger::                ds 1 ; d9a0
wBattleTowerHallwayTrigger::                 ds 1 ; d9a1
wBattleTowerOutsideTrigger::                 ds 1 ; d9a2
wRoute43GateTrigger::                        ds 1 ; d9a3
wMountMoonTrigger::                          ds 1 ; d9a4
wSproutTower3FTrigger::                      ds 1 ; d9a5
wTinTower1FTrigger::                         ds 1 ; d9a6
wBurnedTower1FTrigger::                      ds 1 ; d9a7
wBurnedTowerB1FTrigger::                     ds 1 ; d9a8
wRadioTower5FTrigger::                       ds 1 ; d9a9
wRuinsOfAlphOutsideTrigger::                 ds 1 ; d9aa
wRuinsOfAlphResearchCenterTrigger::          ds 1 ; d9ab
wRuinsOfAlphHoOhChamberTrigger::             ds 1 ; d9ac
wRuinsOfAlphKabutoChamberTrigger::           ds 1 ; d9ad
wRuinsOfAlphOmanyteChamberTrigger::          ds 1 ; d9ae
wRuinsOfAlphAerodactylChamberTrigger::       ds 1 ; d9af
wRuinsOfAlphInnerChamberTrigger::            ds 1 ; d9b0
wMahoganyMart1FTrigger::                     ds 1 ; d9b1
wTeamRocketBaseB1FTrigger::                  ds 1 ; d9b2
wTeamRocketBaseB2FTrigger::                  ds 1 ; d9b3
wTeamRocketBaseB3FTrigger::                  ds 1 ; d9b4
wUndergroundPathSwitchRoomEntrancesTrigger:: ds 1 ; d9b5
wSilverCaveRoom3Trigger::                    ds 1 ; d9b6
wVictoryRoadTrigger::                        ds 1 ; d9b7
wDragonsDenB1FTrigger::                      ds 1 ; d9b8
wDragonShrineTrigger::                       ds 1 ; d9b9
wOlivinePortTrigger::                        ds 1 ; d9ba
wVermilionPortTrigger::                      ds 1 ; d9bb
wFastShip1FTrigger::                         ds 1 ; d9bc
wFastShipB1FTrigger::                        ds 1 ; d9bd
wMountMoonSquareTrigger::                    ds 1 ; d9be
wMobileTradeRoomMobileTrigger::              ds 1 ; d9bf
wMobileBattleRoomTrigger::                   ds 1 ; d9c0


SECTION "Events",WRAMX[$da72],BANK[1]

EventFlags:: ; da72
;RoomDecorations:: ; dac6
;TeamRocketAzaleaTownAttackEvent:: ; db51
;PoliceAtElmsLabEvent:: ; db52
;SalesmanMahoganyTownEvent:: ; db5c
;RedGyaradosEvent:: ; db5c
	flag_array 2000
; db6c

SECTION "Boxes",WRAMX[$db72],BANK[1]

wCurBox:: ; db72
	ds 1

	ds 2

; 8 chars + $50
wBoxNames:: ds 9 * NUM_BOXES ; db75

SECTION "bike", WRAMX[$dbf5],BANK[1]
BikeFlags:: ; dbf5
; bit 1: always on bike
; bit 2: downhill
	ds 1

SECTION "decorations", WRAMX[$dc0f],BANK[1]
; Sprite id of each decoration
Bed:: ; dc0f
	ds 1
Carpet:: ; dc10
	ds 1
Plant:: ; dc11
	ds 1
Poster:: ; dc12
	ds 1
Console:: ; dc13
	ds 1
LeftOrnament:: ; dc14
	ds 1
RightOrnament:: ; dc15
	ds 1
BigDoll:: ; dc16
	ds 1

SECTION "fruittrees", WRAMX[$dc27],BANK[1]
FruitTreeFlags:: ; dc27
	ds 1

SECTION "steps", WRAMX[$dc73],BANK[1]
StepCount:: ; dc73
	ds 1
PoisonStepCount:: ; dc74
	ds 1

SECTION "Visited Spawn Points", WRAMX[$dca5],BANK[1]
VisitedSpawns:: ; dca5
	flag_array 27

SECTION "BackupMapInfo", WRAMX[$dcad],BANK[1]

; used on maps like second floor pokécenter, which are reused, so we know which
; map to return to
BackupMapGroup:: ; dcad
	ds 1
BackupMapNumber:: ; dcae
	ds 1

SECTION "PlayerMapInfo", WRAMX[$dcb4],BANK[1]

WarpNumber:: ; dcb4
	ds 1
MapGroup:: ; dcb5
	ds 1 ; map group of current map
MapNumber:: ; dcb6
	ds 1 ; map number of current map
YCoord:: ; dcb7
	ds 1 ; current y coordinate relative to top-left corner of current map
XCoord:: ; dcb8
	ds 1 ; current x coordinate relative to top-left corner of current map

SECTION "PlayerParty",WRAMX[$dcd7],BANK[1]

PartyCount:: ; dcd7
	ds 1 ; number of Pokémon in party
PartySpecies:: ; dcd8
	ds PARTY_LENGTH ; species of each Pokémon in party
PartyEnd:: ; dcde
	ds 1 ; legacy functions don't check PartyCount
		 
PartyMons::
PartyMon1:: party_struct PartyMon1 ; dcdf
PartyMon2:: party_struct PartyMon2 ; dd0f
PartyMon3:: party_struct PartyMon3 ; dd3f
PartyMon4:: party_struct PartyMon4 ; dd6f
PartyMon5:: party_struct PartyMon5 ; dd9f
PartyMon6:: party_struct PartyMon6 ; ddcf

PartyMonOT:: ds NAME_LENGTH * PARTY_LENGTH ; ddff

PartyMonNicknames:: ds PKMN_NAME_LENGTH * PARTY_LENGTH ; de41
PartyMonNicknamesEnd::


SECTION "Pokedex", WRAMX[$de99], BANK[1]

PokedexCaught:: ; de99
	flag_array NUM_POKEMON
EndPokedexCaught::

PokedexSeen:: ; deb9
	flag_array NUM_POKEMON
EndPokedexSeen::

UnownDex:: ; ded9
	ds 26
UnlockedUnowns:: ; def3
	ds 1

	ds 1

wDaycareMan:: ; def5
; bit 7: active
; bit 6: monsters are compatible
; bit 5: egg ready
; bit 0: monster 1 in daycare
	ds 1

wBreedMon1::
wBreedMon1Nick::  ds PKMN_NAME_LENGTH ; def6
wBreedMon1OT::    ds NAME_LENGTH ; df01
wBreedMon1Stats:: box_struct wBreedMon1 ; df0c

wDaycareLady:: ; df2c
; bit 7: active
; bit 0: monster 2 in daycare
	ds 1

wStepsToEgg:: ; df2d
	ds 1
wDittoInDaycare:: ; df2e
;  z: yes
; nz: no
	ds 1

wBreedMon2::
wBreedMon2Nick::  ds PKMN_NAME_LENGTH ; df2f
wBreedMon2OT::    ds NAME_LENGTH ; df3a
wBreedMon2Stats:: box_struct wBreedMon2 ; df45

wEggNick:: ds PKMN_NAME_LENGTH ; df65
wEggOT::   ds NAME_LENGTH ; df70
wEggMon::  box_struct wEggMon ; df7b

	ds 1

wContestMon:: party_struct wContestMon ; df9c

	ds 3

roam_struct: MACRO
\1Species::   db
\1Level::     db
\1MapGroup::  db
\1MapNumber:: db
\1HP::        ds 1
\1DVs::       ds 2
ENDM

wRoamMon1:: roam_struct wRoamMon1 ; dfcf
wRoamMon2:: roam_struct wRoamMon2 ; dfd6
wRoamMon3:: roam_struct wRoamMon3 ; dfdd



SECTION "WRAMBank5",WRAMX[$d000],BANK[5]

; 8 4-color palettes
Unkn1Pals:: ds 8 * 8 ; d000
Unkn2Pals:: ds 8 * 8 ; d040
BGPals::    ds 8 * 8 ; d080
OBPals::    ds 8 * 8 ; d0c0

LYOverrides:: ; d100
	ds SCREEN_HEIGHT_PX
LYOverridesEnd::

	ds 112

LYOverridesBackup:: ; d200
	ds SCREEN_HEIGHT_PX
LYOverridesBackupEnd::


SECTION "Battle Animations", WRAMX[$d30a], BANK[5]

ActiveAnimObjects:: ; d30a
	ds 4 * 40

	ds 80

ActiveBGEffects:: ; d3fa
	ds 4 * 5

	ds 1

BattleAnimFlags:: ; d40f
	ds 1
BattleAnimAddress:: ; d410
	ds 2
BattleAnimDuration:: ; d412
	ds 1
BattleAnimParent:: ; d413
	ds 2
BattleAnimLoops:: ; d415
	ds 1
BattleAnimVar:: ; d416
	ds 1
BattleAnimByte:: ; d417
	ds 1
	ds 1
BattleAnimTemps:: ; d419
	ds 8


SECTION "Scratch", SRAM, BANK[0]


SECTION "SRAM Bank 1", SRAM, BANK[1]

SECTION "BoxMons", SRAM[$ad10], BANK[1]

sBoxCount::   ds 1 ; ad10
sBoxSpecies:: ds MONS_PER_BOX ; ad11
	ds 1

sBoxMons:: ; ad26
sBoxMon1:: box_struct sBoxMon1
sBoxMon2::
	ds box_struct_length * (MONS_PER_BOX +- 1)

sBoxMonOT:: ds NAME_LENGTH * MONS_PER_BOX ; afa6

sBoxMonNicknames:: ds PKMN_NAME_LENGTH * MONS_PER_BOX ; b082
sBoxMonNicknamesEnd::
; b15e


SECTION "Custom", WRAM0
wSeason:: ds 1
