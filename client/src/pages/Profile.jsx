import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import en from '../content/en';
import { Field, PageHeader, inputCls } from '../components/ui';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { register, handleSubmit } = useForm();

  async function pw(values) {
    if (values.newPw !== values.confPw) return toast.error(en.valid.pwMatch);
    toast.success(en.toasts.saved);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={en.profile.title} />
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-3 text-sm mb-4">
        <div className="flex justify-between"><span className="text-slate-500">{en.profile.fName}</span><b>{user.name}</b></div>
        <div className="flex justify-between"><span className="text-slate-500">{en.profile.fEmail}</span><b>{user.email}</b></div>
        <div className="flex justify-between"><span className="text-slate-500">{en.profile.fRole}</span><b>{user.role}</b></div>
      </div>
      <form onSubmit={handleSubmit(pw)} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">{en.profile.changePw}</h3>
        <Field label={en.profile.curPw}><input type="password" {...register('cur')} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={en.profile.newPw}><input type="password" {...register('newPw')} className={inputCls} /></Field>
          <Field label={en.profile.confPw}><input type="password" {...register('confPw')} className={inputCls} /></Field>
        </div>
        <button className="rounded-xl bg-blue-600 text-white text-sm font-bold px-5 py-2.5">{en.profile.updatePw}</button>
      </form>
    </div>
  );
}
