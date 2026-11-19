"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateNickname, type UpdateNicknameState } from "./actions";
import { NICKNAME_MAX } from "./nickname";

export function ProfileForm({ email, nickname }: { email: string; nickname: string }) {
  const [state, action, pending] = useActionState<UpdateNicknameState, FormData>(updateNickname, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" value={email} readOnly disabled />
        <p className="text-sm text-muted-foreground">초대는 이메일로 받습니다. 이메일은 바꿀 수 없어요.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          name="nickname"
          defaultValue={nickname}
          maxLength={NICKNAME_MAX}
          autoComplete="nickname"
          required
          aria-invalid={state.error ? true : undefined}
        />
        <p className="text-sm text-muted-foreground">멤버 목록과 초대에 이 이름으로 보입니다. 최대 {NICKNAME_MAX}자.</p>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && !state.error && <p className="text-sm text-primary">닉네임을 저장했습니다.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "저장하는 중…" : "저장"}
      </Button>
    </form>
  );
}
