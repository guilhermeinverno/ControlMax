import type { ChangeEvent, MouseEvent, SyntheticEvent } from 'react';

export type HtmlFormSubmitEvent = SyntheticEvent<HTMLFormElement>;
export type HtmlInputChangeEvent = ChangeEvent<HTMLInputElement>;
export type HtmlButtonClickEvent = MouseEvent<HTMLButtonElement>;
export type FormOrButtonEvent = HtmlFormSubmitEvent | HtmlButtonClickEvent;
