section "FollowingScript", romx

FollowingScript::
	jumptextfaceplayer .test
.test
	start_asm
	call .GetFollowingNick
	end_asm

	text_from_ram StringBuffer1
	text ""
	line "leans in."

	para "@"
	text_from_ram StringBuffer1
	text ":"
	line "install gentoo"
	done

.GetFollowingNick:
	push af
	push bc
	push de
	farcall GetFirstAliveMon
	ld a, e
	ld hl, PartyMonNicknames
	ld bc, PKMN_NAME_LENGTH
	call AddNTimes
	ld de, StringBuffer1
	call CopyBytes
	pop de
	pop bc
	pop af
	ret
